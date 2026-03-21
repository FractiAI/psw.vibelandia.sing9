/**
 * Blank Stone edge node — no legacy desktop OS path; hydrogen-line keyed raw packet.
 * Vercel Node = edge relay only. NSPFRNP → ∞⁹
 */
const crypto = require('crypto');

const HYDROGEN_LINE_MHZ = 1420.405751;

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('X-SING9-Blank-Stone', '1');
  res.setHeader('X-SING9-No-Legacy-OS', '1');
  res.setHeader('X-Hydrogen-Line-MHz', String(HYDROGEN_LINE_MHZ));

  const payload = {
    blank_stone: true,
    legacy_operating_system: false,
    node_class: 'sing9-edge-hydrogen-relay',
    hydrogen_line_mhz: HYDROGEN_LINE_MHZ,
    timestamp_utc: new Date().toISOString(),
  };

  const raw = Buffer.from(JSON.stringify(payload), 'utf8');
  const packet_hex = crypto.createHash('sha256').update(raw).digest('hex');

  return res.status(200).json({
    ...payload,
    packet_hex,
    raw_byte_length: raw.length,
    note: 'Raw semantic payload hashed; hydrogen line frequency in body and X-Hydrogen-Line-MHz header.',
  });
};
