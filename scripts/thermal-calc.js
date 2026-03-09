// Physics model — identical constants to goliath-watch.html
const NVL72_RACK_KW  = 120;
const NVL72_BOOST_KW = 150;
const NVL72_FLOW_LPM = 83;
const CP_WATER       = 4186;
const COLD_PLATE     = 15;
const PKG_RESIST     = 8;
const NVIDIA_INLET_MAX = 45;
const THROTTLE_ONSET = 85;
const TJMAX          = 92;
const DAMAGE_C       = 105;

const COOLING_NOMINAL = {
  'liquid-cooled':  { fd: 8,  fe: 0.95 },
  'hybrid':         { fd: 10, fe: 0.80 },
};
const COOLING_FAILURE = {
  'liquid-cooled':  { fd: 12, fe: 0.35 },
  'hybrid':         { fd: 15, fe: 0.30 },
};

function runMode(amb, rack, cool, mode) {
  const b  = COOLING_NOMINAL[cool];
  const f  = COOLING_FAILURE[cool];
  const nr = Math.max(1, Math.round(rack / NVL72_RACK_KW));
  let p, pw, cpd;
  if (mode === 'failure') {
    p = f; pw = NVL72_BOOST_KW * nr; cpd = COLD_PLATE * 2.8;
  } else if (mode === 'stressed') {
    p = { fd: b.fd + 3, fe: b.fe * 0.88 }; pw = NVL72_BOOST_KW * nr; cpd = COLD_PLATE * 1.4;
  } else {
    p = b; pw = rack; cpd = COLD_PLATE;
  }
  const raw_inlet = amb + p.fd;
  const ic  = Math.min(NVIDIA_INLET_MAX, Math.max(18, raw_inlet));
  const fl  = (NVL72_FLOW_LPM * nr * p.fe) / 60;
  const oc  = ic  + (pw * 1000) / (fl * CP_WATER);
  const sc  = oc  + cpd;
  const jc  = sc  + PKG_RESIST;
  const st  = jc >= DAMAGE_C ? 'PERMANENT_DAMAGE'
            : jc >= TJMAX    ? 'MELTDOWN_RISK'
            : jc >= THROTTLE_ONSET ? 'THROTTLING'
            : jc >= 75       ? 'HOT'
            : jc >= 60       ? 'ELEVATED'
            :                  'NOMINAL';
  return { nr, ic: +ic.toFixed(1), oc: +oc.toFixed(1), sc: +sc.toFixed(1), jc: +jc.toFixed(1), st };
}

// ERA5 ECMWF climatological 2m-air means for Abu Dhabi, Lordstown, Virginia
// Source: ECMWF ERA5 reanalysis normals + WMO station cross-check
// Abu Dhabi (24.45N 54.38E): Feb daily mean ~19-22C (winter, chiller always on)
// Lordstown OH (41.18N -80.70W): Feb daily mean ~0-2C (cold OH winter)
// Virginia/Ashburn (39.04N -77.49W): Feb daily mean ~3-5C (mid-Atlantic winter)
const SCENARIOS = [
  // --- G42 Abu Dhabi: 900kW, liquid-cooled ---
  { site: 'G42 Abu Dhabi', rack: 900, cool: 'liquid-cooled', amb: 21.0, mode: 'failure', label: 'Phase 1 - Friction   Jan 28-Feb 3' },
  { site: 'G42 Abu Dhabi', rack: 900, cool: 'liquid-cooled', amb: 20.0, mode: 'failure', label: 'Phase 2 - Drop       Feb 4-6  (NO EGS-HHL baseline)' },
  { site: 'G42 Abu Dhabi', rack: 900, cool: 'liquid-cooled', amb: 20.0, mode: 'nominal', label: 'Phase 2 - Drop       Feb 4-6  (WITH EGS-HHL, nominal)' },
  { site: 'G42 Abu Dhabi', rack: 900, cool: 'liquid-cooled', amb: 21.0, mode: 'failure', label: 'Phase 4 - Return     Feb 7-20' },
  { site: 'G42 Abu Dhabi', rack: 900, cool: 'liquid-cooled', amb: 22.0, mode: 'failure', label: 'Phase 5 - Melt       Feb 21' },
  { site: 'G42 Abu Dhabi', rack: 900, cool: 'liquid-cooled', amb: 20.5, mode: 'failure', label: 'Trial 2  Handshake   Feb 13-14 (NO EGS-HHL)' },
  { site: 'G42 Abu Dhabi', rack: 900, cool: 'liquid-cooled', amb: 20.5, mode: 'nominal', label: 'Trial 2  Handshake   Feb 13-14 (WITH EGS-HHL)' },
  // --- Lordstown OH: 1200kW, liquid-cooled ---
  { site: 'Lordstown OH',  rack: 1200, cool: 'liquid-cooled', amb: 1.0, mode: 'failure', label: 'Trial 2  Handshake   Feb 14-15 (NO EGS-HHL)' },
  { site: 'Lordstown OH',  rack: 1200, cool: 'liquid-cooled', amb: 1.0, mode: 'nominal', label: 'Trial 2  Handshake   Feb 14-15 (WITH EGS-HHL)' },
  // --- Virginia/Ashburn: 1200kW, liquid-cooled ---
  { site: 'Virginia/Ashburn', rack: 1200, cool: 'liquid-cooled', amb: 4.0, mode: 'failure', label: 'Virginia co-site  post-betrayal NO EGS-HHL' },
  { site: 'Virginia/Ashburn', rack: 1200, cool: 'liquid-cooled', amb: 4.0, mode: 'nominal', label: 'Virginia co-site  WITH EGS-HHL' },
];

console.log('=== MELTGATE THERMAL MODEL — CALCULATED OUTPUTS ===\n');
console.log('Physics chain: ambient (ERA5) -> inlet -> Q=mCpDT -> outlet -> cold plate -> junction\n');
for (const s of SCENARIOS) {
  const r = runMode(s.amb, s.rack, s.cool, s.mode);
  console.log(s.label);
  console.log(`  site=${s.site} | amb=${s.amb}C | nr=${r.nr} racks | inlet=${r.ic}C | outlet=${r.oc}C | surface=${r.sc}C | JUNCTION=${r.jc}C | [${r.st}]`);
  console.log('');
}
