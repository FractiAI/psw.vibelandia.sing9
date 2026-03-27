/**
 * Human-readable demonstration boundaries for gateway probe JSON responses.
 * NSPFRNP → ∞⁹
 */

export function fullStackProbe(ok) {
  return {
    tested_and_successfully_shown: [
      'HTTPS GET to public OpenWebRX /status.json (or recorded error) — real remote metadata.',
      'HTTPS GET to NOAA SWPC operational JSON — ionosphere / Kp context (or partial errors listed).',
      'Hydrogen-line memory: two writes at a derived location_hash, read-back, Jupiter-tier integrity (value_hash vs JSON value).',
      'Solar Compute scheduler receipt linked to latest memory record_id and value_hash.',
      'Logical grid replica ring from HLINE_REPLICA_NODES or default node list.',
    ],
    not_yet_demonstrated: [
      'Electromagnetic transmission or reception at 1420.405751 MHz as physical RF from this server process.',
      'EGS constant as a measured physical coupling constant — only as protocol/config in software.',
      'IQ capture, PSD, or cyclostationary detection (see passive RF Tier 1+ docs).',
      'Worldwide power grid or ionosphere as literal analog RF storage — telemetry is awareness context only unless separately instrumented.',
    ],
    overall_ok: ok === true,
  };
}

export function mirrorPickupProof(ok) {
  return {
    tested_and_successfully_shown: [
      'Raw UTF-8 body of GET …/status.json hashed with SHA-256.',
      'Same hash stored in hydrogen-line record value and verified on read (value_hash integrity).',
      'hline:// addressing via location_hash; record readable via read_hydrogen_line_memory.',
      'sdr_view.public_ui_url links to OpenWebRX Web UI where spectrum/waterfall can be viewed (browser).',
    ],
    not_yet_demonstrated: [
      'That the OpenWebRX receiver is displaying galactic HI at rest frequency (depends on profile; many nodes are HF/VHF).',
      'RF sampling pipeline inside this repo — visualization is the public Web SDR, not embedded IQ here.',
    ],
    overall_ok: ok === true,
  };
}

export function passiveRfTier0(allGeometryPass, httpSuccess) {
  return {
    tested_and_successfully_shown: [
      'Per-profile passband geometry: f_lo, f_hi from center_freq and sample_rate.',
      'Binary check: H I rest frequency inside passband vs not (includes_hi_rest).',
      'Consistency between full enumeration and findProfileCoveringHiRest() (null hypothesis for finder logic).',
    ],
    not_yet_demonstrated: [
      'Noise floor (dB), RFI masks, gain stability — no IQ at Tier 0.',
      'PSD shape, correlation detector, EGS-keyed statistic in RF noise.',
    ],
    overall_ok: allGeometryPass === true && httpSuccess > 0,
  };
}

export function roundtripProbe(ok) {
  return {
    tested_and_successfully_shown: [
      'Autonomous writer → reader → verifier on shared hydrogen-line location_hash.',
      'Jupiter-tier placement on write; integrity on read; verifier compares writer vs reader payload.',
      'Solar compute receipt fields linked to writer memory_record_id and placement value_hash.',
      'Ed25519-signed verifier receipt payload when signing succeeds.',
      'Optional OpenWebRX / NOAA context in strict-off mode (legacy awareness) for location anchor.',
    ],
    not_yet_demonstrated: [
      'Physical RF observation or transmission at hydrogen line rest frequency by this server.',
      'Independent observatory L-band data products bound to the same run_id.',
    ],
    overall_ok: ok === true,
  };
}

export function sdrGatewayHandshake(ok) {
  return {
    tested_and_successfully_shown: [
      'Agent 1 write with OpenWebRX evidence embedded in value.',
      'Agent 2 read + write acknowledgment linked to Agent 1 key.',
      'Agent 3 integrity + semantic checks with structured fix_suggestions on failure.',
    ],
    not_yet_demonstrated: [
      'Independent hosted LLM agents — roles are deterministic server agents.',
      'L-band sky HI detection — evidence is HTTP /status.json metadata.',
    ],
    overall_ok: ok === true,
  };
}
