#!/usr/bin/env node
/**
 * Digital pretests for SPO / HH OS validation gates (toy models).
 *
 * What this IS: time-stepped dynamics, phase metrics, choreographed vs random
 * excitation, 2-DOF modal toy, dyno toy with uncertainty — runnable without NumPy.
 *
 * What this IS NOT: combustion CFD, full engine FEA, validated piezo–block coupling,
 * or proof of over-unity torque. Parameters are explicit; tune them to match hardware.
 *
 * Usage: node sim/pretest-gates.mjs [0|1|2|3|all]
 */

const PI = Math.PI;
const TAU = 2 * PI;

function clamp(x, a, b) {
  return Math.max(a, Math.min(b, x));
}

// ── Gate 0: driven 2nd-order “coupon” + coherence proxy ───────────────────────
function gate0() {
  const dt = 2e-5;
  const tEnd = 3;
  const f0 = 80; // Hz — toy structural mode
  const omega0 = TAU * f0;
  const zeta = 0.03;
  const omegaDrive = omega0; // on-resonance drive for max coherent buildup
  const A = 1;

  let x = 0;
  let v = 0;
  let t = 0;
  const xs = [];
  const drives = [];
  const sinD = [];
  let step = 0;
  while (t < tEnd) {
    const drive = A * Math.cos(omegaDrive * t);
    const a = -2 * zeta * omega0 * v - omega0 * omega0 * x + drive;
    v += a * dt;
    x += v * dt;
    t += dt;
    step++;
    if (step % 200 === 0) {
      xs.push(x);
      drives.push(drive);
      sinD.push(A * Math.sin(omegaDrive * t));
    }
  }

  // Coherence proxy: linear LTI steady-state is ~90° vs cos drive — use quadrature:
  // coherence = sqrt(rho(x,cos)^2 + rho(x,sin)^2) in [0,1] for single-tone
  function corr(a, b) {
    const n = Math.min(a.length, b.length);
    let ma = 0,
      mb = 0;
    for (let i = 0; i < n; i++) {
      ma += a[i];
      mb += b[i];
    }
    ma /= n;
    mb /= n;
    let num = 0,
      sa = 0,
      sb = 0;
    for (let i = 0; i < n; i++) {
      const da = a[i] - ma;
      const db = b[i] - mb;
      num += da * db;
      sa += da * da;
      sb += db * db;
    }
    return num / (Math.sqrt(sa * sb) + 1e-18);
  }

  const n = Math.min(xs.length, drives.length, sinD.length);
  const rhoCos = corr(xs, drives.slice(0, n));
  const rhoSin = corr(xs, sinD.slice(0, n));
  const rhoQuad = Math.sqrt(rhoCos * rhoCos + rhoSin * rhoSin);

  // RMS amplitude (steady-ish window, last 30% of samples)
  const start = Math.floor(n * 0.5);
  let sumSq = 0;
  for (let i = start; i < n; i++) sumSq += xs[i] * xs[i];
  const rms = Math.sqrt(sumSq / Math.max(1, n - start));

  return {
    name: 'Gate 0 · bench coupon (2nd-order + harmonic drive)',
    metrics: {
      correlation_rho_cos: rhoCos,
      correlation_rho_sin: rhoSin,
      coherence_quadrature: rhoQuad,
      response_rms_last_window: rms,
      detune_hz: (omegaDrive - omega0) / TAU,
    },
    pass_hint: rhoQuad > 0.9 ? 'coherence_proxy_strong' : 'coherence_proxy_weak_check_detune_or_damping',
  };
}

// ── Gate 1: crank-indexed pulses vs random-phase same energy ─────────────────
function gate1() {
  const dt = 1e-4;
  const tEnd = 2;
  const omegaCrank = TAU * 15; // 15 Hz = 900 RPM equivalent for toy
  const zeta = 0.1;
  const w = TAU * 80; // structure resonance (rad/s)

  function oneRun(phased) {
    let y = 0;
    let vy = 0;
    let t = 0;
    let energyPhased = 0;
    const impulses = [];

    while (t < tEnd) {
      const theta = (omegaCrank * t) % TAU;
      let j = 0;
      if (phased) {
        if (theta < 0.35) j = 0.08; // window along revolution
      } else {
        // random energy per tick — same *average* pulse rate as phased (rough match)
        if (Math.random() < 0.018) j = 0.08 * (Math.random() > 0.5 ? 1 : -1);
      }
      const a = -2 * zeta * w * vy - w * w * y + j;
      vy += a * dt;
      y += vy * dt;
      t += dt;
      energyPhased += j * j;
    }
    return { y_rms: Math.sqrt(y * y + vy * vy / (w * w)), energy_in: energyPhased };
  }

  const trials = 40;
  let sumPh = 0,
    sumR = 0;
  for (let k = 0; k < trials; k++) {
    sumPh += oneRun(true).y_rms;
    sumR += oneRun(false).y_rms;
  }

  return {
    name: 'Gate 1 · crank-window pulses vs random (same toy plant)',
    metrics: {
      trials,
      mean_response_metric_phased: sumPh / trials,
      mean_response_metric_random: sumR / trials,
      ratio_phased_to_random: (sumPh / trials) / (sumR / trials + 1e-18),
    },
    pass_hint: sumPh / trials > sumR / trials * 1.05 ? 'phased_wins_use_real_encoder' : 'tune_window_or_plant',
  };
}

// ── Gate 2: 2-DOF stiffness tweak → modal frequency shift (2×2 eigenvalues) ──
function gate2() {
  const m1 = 1,
    m2 = 1;
  const k1 = 1e6,
    k2 = 5e5,
    k3 = 1e6;

  function eigenHz(K) {
    const a = K[0][0] / m1,
      b = K[0][1] / m1,
      c = K[1][0] / m2,
      d = K[1][1] / m2;
    const tr = a + d;
    const det = a * d - b * c;
    const disc = tr * tr - 4 * det;
    const l1 = (tr + Math.sqrt(Math.max(0, disc))) / 2;
    const l2 = (tr - Math.sqrt(Math.max(0, disc))) / 2;
    const f1 = Math.sqrt(Math.max(0, l1)) / TAU;
    const f2 = Math.sqrt(Math.max(0, l2)) / TAU;
    return { f1, f2, lambda1: l1, lambda2: l2 };
  }

  const K0 = [
    [k1 + k2, -k2],
    [-k2, k2 + k3],
  ];
  // “Pods stiffen coupling” — increase k2 by 8%
  const K1 = [
    [k1 + k2 * 1.08, -k2 * 1.08],
    [-k2 * 1.08, k2 * 1.08 + k3],
  ];

  const e0 = eigenHz(K0);
  const e1 = eigenHz(K1);

  return {
    name: 'Gate 2 · 2-DOF modal toy (stiffness perturbation)',
    metrics: {
      mode1_hz_baseline: e0.f1,
      mode2_hz_baseline: e0.f2,
      mode1_hz_stiffened: e1.f1,
      mode2_hz_stiffened: e1.f2,
      delta_mode1_hz: e1.f1 - e0.f1,
      delta_mode2_hz: e1.f2 - e0.f2,
    },
    pass_hint: 'if_real_hardware_expect_smaller_shifts_measure_with_accel_array',
  };
}

// ── Gate 3: toy dyno A/B (overlay adds bounded torque; noise on fuel meter) ──
function gate3() {
  const rng = (s) => {
    let x = s >>> 0;
    return () => ((x = (x * 1664525 + 1013904223) >>> 0) / 4294967296);
  };
  const rand = rng(20260409);

  const T_base = 200; // N·m toy
  const fuel_base = 12; // L/100km toy
  const overlay_torque = 15; // N·m claimed assist (bounded)
  const sigma = 0.4; // measurement noise on fuel

  function sampleFuel(overlayOn) {
    const T = T_base + (overlayOn ? overlay_torque : 0);
    // toy: fuel ~ 1/T efficiency improvement from extra torque (not physical BSFC model)
    const fuelIdeal = fuel_base * (T_base / T);
    return fuelIdeal + (rand() - 0.5) * 2 * sigma;
  }

  const N = 500;
  let sumA = 0,
    sumB = 0;
  for (let i = 0; i < N; i++) {
    sumA += sampleFuel(false);
    sumB += sampleFuel(true);
  }

  const meanA = sumA / N;
  const meanB = sumB / N;
  const pct = ((meanA - meanB) / meanA) * 100;

  return {
    name: 'Gate 3 · toy dyno A/B (bounded overlay torque + noisy fuel readout)',
    metrics: {
      samples: N,
      mean_fuel_overlay_off: meanA,
      mean_fuel_overlay_on: meanB,
      percent_fuel_reduction_mean: pct,
      assumed_overlay_torque_Nm: overlay_torque,
      fuel_noise_sigma: sigma,
    },
    pass_hint: 'replace_with_real_BSFC_map_and_emissions_cage_not_toy_inverse_torque',
  };
}

function printGate(g) {
  console.log('\n═══ ' + g.name + ' ═══');
  console.log(JSON.stringify(g.metrics, null, 2));
  console.log('hint: ' + g.pass_hint);
}

const arg = process.argv[2] || 'all';

const gates = {
  0: gate0,
  1: gate1,
  2: gate2,
  3: gate3,
};

if (arg === 'all') {
  console.log('SPO / HH OS digital pretest (toy models). See file header for limits.\n');
  for (const k of ['0', '1', '2', '3']) printGate(gates[k]());
} else if (gates[arg] !== undefined) {
  printGate(gates[arg]());
} else {
  console.error('Usage: node sim/pretest-gates.mjs [0|1|2|3|all]');
  process.exit(1);
}
