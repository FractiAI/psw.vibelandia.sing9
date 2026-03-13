'use strict';
/**
 * Fix mojibake (wrong encoding) across ALL surfaces: HTML, JS, JSON, MD, TXT.
 * Replaces known mojibake sequences with actual Unicode characters.
 * All files are written as UTF-8 so emoji and symbols display correctly.
 * Run from repo root: node scripts/fix-mojibake-all-surfaces.js
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');

// ─── Mojibake → actual Unicode character (output is real char; file saved as UTF-8) ───
const MOJIBAKE_TO_CHAR = [
  // Punctuation / symbols
  ['\u00C2\u00B7', '\u00B7'],             // · → ·
  ['\u00E2\u20AC\u201C', '\u2014'],       // â€" → —
  ['\u00E2\u20AC\u2013', '\u2014'],       // â€" (en-dash) → —
  ['\u00E2\u20AC\u2014', '\u2014'],       // â€"— → —
  ['\u00E2\u2020\u2019', '\u2192'],       // â†' → →
  ['\u00E2\u02C6\u017E\u00E2\u00B9', '\u221E\u2079'], // ∞⁹ → ∞⁹
  ['\u00E2\u02C6\u017E\u00E2\u2079', '\u221E\u2079'],
  ['\u00E2\u2014\u02C6', '\u25C8'],       // ◈ → ◈
  ['\u00E2\u00AC\u00A1', '\u2B21'],       // ⬡ → ⬡
  ['\u00E2\u0161\u00A1', '\u26A1'],       // ⚡ → ⚡
  ['\u00E2\u2030\u02C6', '\u2248'],      // ≈ → ≈ (approx)
  ['\u00E2\u2020\u00BA', '\u203A'],       // › → ›
  ['\u00E2\u0153\u2022', '\u2715'],       // ✕ → ✕
  ['\u00E2\u0153\u017D', '\u270E'],       // ✎ → ✎
  ['\u00E2\u0153\u00A6', '\u2726'],       // ✦ → ✦
  ['\u00E2\u2122\u203A', '\uD83D\uDC1D'], // ♥\u203A → 🐝 (bees pill)
  ['\u00E2\u2122', '\u2665'],             // ♥ → ♥ (if not followed by ›)
  // Emoji (surrogate pairs) – mojibake bytes → real emoji
  ['\u00F0\u0178\u201C\u00A5', '\uD83D\uDD25'],   // 🔥 → 🔥
  ['\u00F0\u0178\u0022\u00A5', '\uD83D\uDD25'],
  ['\u00F0\u0178\u201C\u2013', '\uD83D\uDCD6'],   // ðŸ"– → 📖
  ['\u00F0\u0178\u201C\u00AC', '\uD83D\uDD2C'],   // 🔬 → 🔬
  ['\u00F0\u0178\u017D\u201C', '\uD83C\uDF0F'],   // ðŸŽ" → 🎓
  ['\u00F0\u0178\u0022\u00AC', '\uD83D\uDD2C'],
  ['\u00F0\u0178\u2019\u00B5', '\uD83D\uDCB5'],   // ðŸ'š → 💵
  ['\u00F0\u0178\u2019\u00B3', '\uD83D\uDCB3'],   // ðŸ'™ → 💳
  // More emoji from hh-os-docs and others (4-byte mojibake: F0 9F XX YY as Latin-1)
  ['\u00F0\u0178\u2013\u00A5', '\uD83D\uDCC5'],   // ðŸ–¥ 📅 calendar
  ['\u00F0\u0178\u201C\u008D', '\uD83D\uDCCD'],   // ðŸ" 📍 pin
  ['\u00F0\u0178\u0022\u008D', '\uD83D\uDCCD'],
  ['\u00F0\u0178\u201C\u008A', '\uD83D\uDCCA'],   // ðŸ"Š 📊 chart
  ['\u00F0\u0178\u0022\u008A', '\uD83D\uDCCA'],
  ['\u00F0\u0178\u201C\u2026', '\uD83D\uDCC1'],   // ðŸ"… 📁 folder
  ['\u00F0\u0178\u0152\u20AC', '\uD83C\uDF10'],   // ðŸŒ€ 🌐 globe
  ['\u00F0\u0178\u0153\u20AC', '\uD83C\uDF10'],
  ['\u00F0\u0178\u2122\u00A0', '\uD83E\uDDF2'],   // ðŸ§² magnet
  ['\u00F0\u0178\u00A7\u00B2', '\uD83E\uDDE0'],   // ðŸ§² brain
  ['\u00F0\u0178\u201C\u00A7', '\uD83D\uDCD7'],   // ðŸ"§ green book
  ['\u00F0\u0178\u0192\u2014', '\uD83C\uDFD7'],   // ðŸ— building
  ['\u00F0\u0178\u201C\u00A7', '\uD83D\uDCD7'],   // ðŸ"§
  ['\u00F0\u0178\u0152\u0090', '\uD83C\uDF10'],   // ðŸŒ globe
  ['\u00F0\u0178\u00A4\u009D', '\uD83E\uDD1D'],   // ðŸ¤ handshake
  // Latin-1 accented (UTF-8 C3 XX misinterpreted as Ã + char)
  ['\u00C3\u00A9', '\u00E9'],   // Ã© → é
  ['\u00C3\u00AD', '\u00ED'],   // Ã­ → í
  ['\u00C3\u00B3', '\u00F3'],   // Ã³ → ó
  ['\u00C3\u00A1', '\u00E1'],   // Ã¡ → á
  ['\u00C3\u00B1', '\u00F1'],   // Ã± → ñ
  ['\u00C3\u00BA', '\u00FA'],   // Ãº → ú
  ['\u00C3\u00A7', '\u00E7'],   // Ã§ → ç
  ['\u00C3\u00B6', '\u00F6'],   // Ã¶ → ö
  ['\u00C3\u00BC', '\u00FC'],   // Ã¼ → ü
  ['\u00C3\u0097', '\u00D7'],   // Ã— → × (times)
  // Box-drawing / comment lines (â• = E2 94 80 as Latin-1)
  ['\u00E2\u0094\u0080', '\u2500'],   // â• → ─
  ['\u00E2\u0094\u0082', '\u2502'],   // â"‚ → │
  ['\u00E2\u201C\u20AC', '\u2500'],   // variant box
  // Symbols in README/docs
  ['\u00E2\u02C6\u017E', '\u221E'],   // âˆž → ∞ (3-char)
  ['\u00E2\u2030\u2039', '\u2248'],   // â‰‹ → ≈
  ['\u00E2\u0153\u00A7', '\u2726'],   // âœ§ → ✦
];

// Regex: â€ + any 1 char → — ; â† + specific → arrows ; ∞⁹ ; generic 4-byte emoji mojibake
const EMDASH_MOJI_REGEX = /\u00E2\u20AC./g;
const ARROW_LEFT_REGEX = /\u00E2\u2020\u0090/g;
const INFINITY_9_REGEX = /\u00E2\u02C6\u017E\u00E2../g;
const STRIP_AC_BULLET = '\u00C2\u00B7';
// 4-byte emoji mojibake: bytes misinterpreted as Windows-1252 → decode original UTF-8
// Win-1252 bytes 0x80-0x9F, 0xA0-0xFF map to Unicode; reverse: code point → byte
const CP1252_TO_BYTE = {
  0x20AC: 0x80, 0x201A: 0x82, 0x0192: 0x83, 0x201E: 0x84, 0x2026: 0x85, 0x2020: 0x86, 0x2021: 0x87, 0x02C6: 0x88, 0x2030: 0x89, 0x0160: 0x8A, 0x2039: 0x8B, 0x0152: 0x8C, 0x2018: 0x91, 0x2019: 0x92, 0x201C: 0x94, 0x201D: 0x95, 0x2013: 0x96, 0x2014: 0x97, 0x02DC: 0x98, 0x2122: 0x99, 0x0161: 0x9A, 0x203A: 0x9B, 0x0153: 0x9C, 0x017D: 0x9E, 0x017E: 0x9F, 0x0178: 0x9F
};
function codePointToByte(cp) {
  if (cp >= 0 && cp <= 0xFF) return cp;
  return CP1252_TO_BYTE[cp] !== undefined ? CP1252_TO_BYTE[cp] : cp & 0xFF;
}
const EMOJI_4BYTE_MOJI_REGEX = /(\u00F0)(\u0178)(.)(.)/g;
function decodeEmojiMoji(_, c0, c1, c2, c3) {
  const b0 = codePointToByte(c0.charCodeAt(0)), b1 = codePointToByte(c1.charCodeAt(0)), b2 = codePointToByte(c2.charCodeAt(0)), b3 = codePointToByte(c3.charCodeAt(0));
  if (b0 !== 0xF0 || b1 !== 0x9F) return _;
  try {
    return Buffer.from([b0, b1, b2, b3]).toString('utf8');
  } catch (e) {
    return _;
  }
}

function applyFixes(content) {
  let s = content;
  for (const [from, to] of MOJIBAKE_TO_CHAR) {
    s = s.split(from).join(to);
  }
  s = s.replace(EMDASH_MOJI_REGEX, '\u2014');
  s = s.replace(ARROW_LEFT_REGEX, '\u2190');
  s = s.replace(INFINITY_9_REGEX, '\u221E\u2079');
  s = s.split(STRIP_AC_BULLET).join('\u00B7');
  s = s.replace(EMOJI_4BYTE_MOJI_REGEX, decodeEmojiMoji);
  return s;
}

function getAllFiles(dir, extList, excludeDirs, excludeFiles, list) {
  list = list || [];
  if (!fs.existsSync(dir)) return list;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    const rel = path.relative(root, full);
    const relNorm = rel.replace(/\\/g, '/');
    if (e.isDirectory()) {
      if (excludeDirs.some(d => relNorm.startsWith(d) || e.name === d)) continue;
      getAllFiles(full, extList, excludeDirs, excludeFiles, list);
    } else if (e.isFile() && extList.some(ext => e.name.endsWith(ext))) {
      if (excludeFiles.some(f => relNorm === f || relNorm.endsWith('/' + f))) continue;
      list.push(full);
    }
  }
  return list;
}

function main() {
  const excludeDirs = ['node_modules', '.git', 'interfaces/assets/deck4'];
  const excludeFiles = [
    'scripts/fix-mojibake-i18n.js',
    'scripts/fix-emoji-mojibake.js',
    'scripts/fix-mojibake-all-surfaces.js',
  ];
  const exts = ['.html', '.js', '.json', '.md', '.txt'];
  const files = getAllFiles(root, exts, excludeDirs, excludeFiles);
  let changed = 0;
  const report = [];
  for (const filePath of files) {
    const rel = path.relative(root, filePath);
    let content;
    try {
      content = fs.readFileSync(filePath, 'utf8');
    } catch (err) {
      report.push({ file: rel, status: 'read_error', error: err.message });
      continue;
    }
    const original = content;
    const fixed = applyFixes(content);
    if (fixed !== original) {
      fs.writeFileSync(filePath, fixed, 'utf8');
      changed++;
      report.push({ file: rel, status: 'fixed' });
    }
  }
  console.log('fix-mojibake-all-surfaces.js');
  console.log('Scanned:', files.length, 'files');
  console.log('Fixed:', changed, 'files');
  report.filter(r => r.status === 'fixed').forEach(r => console.log('  -', r.file));
  if (report.some(r => r.status === 'read_error')) {
    report.filter(r => r.status === 'read_error').forEach(r => console.log('  READ ERROR:', r.file, r.error));
  }
  return { total: files.length, changed, report };
}

main();
