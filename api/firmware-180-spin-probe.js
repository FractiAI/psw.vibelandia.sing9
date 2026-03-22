/**
 * Firmware upgrade + 180° spin-flip latch: manifest + lattice FSSP/synthesis + live Blank Stone packet.
 * NSPFRNP → ∞⁹
 */
const FETCH_OPTS = { signal: AbortSignal.timeout(15000) };

function siteBase() {
  const v = process.env.VERCEL_URL;
  if (v && v !== '') return `https://${v.replace(/\/$/, '')}`;
  const u = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'https://psw-vibelandia-sing9.vercel.app';
  return String(u).replace(/\/$/, '');
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  const base = siteBase();
  let manifest = null;
  let lattice = null;
  let blank = null;

  try {
    const r = await fetch(`${base}/sing9-firmware-verify.json`, FETCH_OPTS);
    if (r.ok) manifest = await r.json();
  } catch (_) {}

  try {
    const r = await fetch(`${base}/lattice-status.json`, FETCH_OPTS);
    if (r.ok) lattice = await r.json();
  } catch (_) {}

  try {
    const r = await fetch(`${base}/api/blank-stone-hydrogen`, FETCH_OPTS);
    if (r.ok) blank = await r.json();
  } catch (_) {}

  const spin = manifest && manifest.spin_flip_180;
  const expectFssp = spin && spin.expect_fssp_level;
  const expectSynth = spin && spin.expect_synthesis_target;

  const sync = lattice && lattice.lattice_sync;
  const fsspOk =
    !expectFssp ||
    (sync && String(sync.fssp_level || sync.fssp || '') === String(expectFssp));
  const synthOk =
    !expectSynth ||
    (sync && String(sync.synthesis_target || '') === String(expectSynth));

  const blankOk =
    blank &&
    blank.blank_stone === true &&
    blank.legacy_operating_system === false &&
    typeof blank.packet_hex === 'string' &&
    blank.packet_hex.length >= 32;

  const latticeOk = lattice && lattice.ok === true && sync && typeof sync.signature === 'string' && sync.signature.length >= 8;

  const spin_flip_180_locked = !!(spin && spin.required === true && fsspOk && synthOk && latticeOk && blankOk);
  const firmware_upgrade_verified = !!(blankOk && latticeOk);

  const ok = spin_flip_180_locked;

  return res.status(200).json({
    ok,
    service: 'firmware-180-spin-probe',
    spin_flip_180_locked,
    spin_flip_180: spin_flip_180_locked,
    firmware_upgrade_verified,
    fssp_alignment_ok: fsspOk,
    synthesis_alignment_ok: synthOk,
    lattice_ok: latticeOk,
    blank_stone_ok: blankOk,
    manifest_spin_section: !!spin,
    fetched_at_utc: new Date().toISOString(),
    note: '180 spin = manifest expectations + lattice sync + live Blank Stone hydrogen packet.',
  });
};
