'use strict';
const fs = require('fs');
const path = require('path');

const i18nPath = path.join(__dirname, '..', 'interfaces', 'i18n.js');
let s = fs.readFileSync(i18nPath, 'utf8');

// Add missing landing.ac_configure (after first landing.ac_stack_body, before landing.foot_line)
if (!s.includes("'landing.ac_configure'")) {
  s = s.replace(
    /('landing\.ac_stack_body'\s*:\s*[^,]+,)\s*('landing\.foot_line')/,
    "$1\n      'landing.ac_configure'  : 'Configure yours \\u2192',\n      $2"
  );
}

// Replace literal mojibake sequences (UTF-8 interpreted as Latin-1) with escapes
const mojibakeStrings = [
  ['\u00C2\u00B7', '\\u00B7'],       // Â· → ·
  ['\u00E2\u20AC\u201C', '\\u2014'], // â€" → —
  ['\u00E2\u20AC\u2013', '\\u2014'], // â€" (en-dash) → —
  ['\u00E2\u02C6\u017E\u00E2\u00B9', '\\u221E\\u2079'], // âˆžâ¹ → ∞⁹
  ['\u00E2\u02C6\u017E\u00E2\u2079', '\\u221E\\u2079'], // âˆžâ¹ (⁹) → ∞⁹
  ['\u00E2\u2020\u2019', '\\u2192'], // â†' → →
];
for (const [from, to] of mojibakeStrings) {
  s = s.split(from).join(to);
}
// Replace mojibake / non-ASCII symbols with Unicode escapes so file is ASCII-safe
const replacements = [
  [/\u2014/g, '\\u2014'],   // — em dash
  [/\u2192/g, '\\u2192'],   // →
  [/\u221E/g, '\\u221E'],   // ∞
  [/\u2079/g, '\\u2079'],   // ⁹
  [/\u25B6/g, '\\u25B6'],   // ▶
  [/\u2715/g, '\\u2715'],   // ✕
  [/\u270E/g, '\\u270E'],   // ✎
  [/\u26A1/g, '\\u26A1'],   // ⚡
  [/\u2B21/g, '\\u2B21'],   // ⬡
  [/\u25C8/g, '\\u25C8'],   // ◈
  [/\u2665/g, '\\u2665'],   // ♥
  [/\u2190/g, '\\u2190'],   // ←
  [/\u21B6/g, '\\u21B6'],   // ↩
  [/\u2605/g, '\\u2605'],   // ★
  [/\u00B7/g, '\\u00B7'],   // ·
];
for (const [re, replacement] of replacements) {
  s = s.replace(re, replacement);
}
// Emoji: replace mojibake (UTF-8 bytes misread as Latin-1) with JS escapes so they render
// Bytes F0 9F 94 A5 (🔥) -> ðŸ"¥ = \u00F0\u0178\u201C\u00A5 etc.
const emojiMojibake = [
  ['\u00F0\u0178\u201C\u00A5', '\\uD83D\\uDD25'],   // fire 🔥
  ['\u00F0\u0178\u201C\u2013', '\\uD83D\\uDCD6'],   // book 📖 (– = en-dash U+2013)
  ['\u00F0\u0178\u201C\u00AC', '\\uD83D\\uDD2C'],   // microscope 🔬
  ['\u00F0\u0178\u017D\u201C', '\\uD83C\\uDF0F'],   // globe 🎓 (0x8E=Ž U+017D)
  ['\u00F0\u0178\u2019\u00B5', '\\uD83D\\uDCB5'],   // cash 💵 (0x92=' 0xB5=µ)
  ['\u00F0\u0178\u2019\u00B3', '\\uD83D\\uDCB3'],   // card 💳 (0xB3=³)
];
for (const [from, to] of emojiMojibake) {
  s = s.split(from).join(to);
}
// Fire 🔥: try straight quote variant (") U+0022
s = s.split('\u00F0\u0178\u0022\u00A5').join('\\uD83D\\uDD25');
// intel_tracker / HFCS: â + — + ˆ → ◈
s = s.split('\u00E2\u2014\u02C6').join('\\u25C8');
// Other mojibake: âœ• (✕), âœŽ (✎), â†º (›)
s = s.split('\u00E2\u0153\u2022').join('\\u2715');
s = s.split('\u00E2\u0153\u017D').join('\\u270E');
s = s.split('\u00E2\u2020\u00BA').join('\\u203A');
// Also replace actual emoji if present (surrogate pairs)
s = s.replace(/\uD83D\uDD25/g, '\\uD83D\\uDD25');
s = s.replace(/\uD83D\uDCD6/g, '\\uD83D\\uDCD6');
s = s.replace(/\uD83D\uDD2C/g, '\\uD83D\\uDD2C');
s = s.replace(/\uD83C\uDF0F/g, '\\uD83C\\uDF0F');
s = s.replace(/\uD83D\uDCB5/g, '\\uD83D\\uDCB5');
s = s.replace(/\uD83D\uDCB3/g, '\\uD83D\\uDCB3');
s = s.replace(/\u2726/g, '\\u2726'); // ✦ (star in nav)

fs.writeFileSync(i18nPath, s, 'utf8');
console.log('i18n.js: ac_configure added, mojibake replaced with escapes');

// Fix nav-strip.js the same way (no ac_configure)
const navPath = path.join(__dirname, '..', 'nav-strip.js');
let nav = fs.readFileSync(navPath, 'utf8');
// Apply same punctuation mojibake to nav (CYA lines, comments)
for (const [from, to] of mojibakeStrings) {
  nav = nav.split(from).join(to);
}
// ∞⁹: match âˆžâ + any 2 chars (variant encodings for ¹/⁹)
nav = nav.replace(/\u00E2\u02C6\u017E\u00E2../g, '\\u221E\\u2079');
// Nav-specific mojibake for symbols/emoji
const navMojibake = [
  ['\u00E2\u00AC\u00A1', '\\u2B21'],   // â¬¡ → ⬡
  ['\u00E2\u2014\u02C6', '\\u25C8'],   // â—ˆ → ◈
  ['\u00F0\u0178\u201C\u00A5', '\\uD83D\\uDD25'],  // fire
  ['\u00F0\u0178\u0022\u00A5', '\\uD83D\\uDD25'],  // fire (straight quote)
  ['\u00E2\u0153\u00A6', '\\u2726'],   // âœ¦ → ✦
];
for (const [from, to] of navMojibake) {
  nav = nav.split(from).join(to);
}
// Nav: strip stray Â before \u00B7 (mojibake bullet)
nav = nav.split('\u00C2\\u00B7').join('\\u00B7');
nav = nav.split('\u00C2\u00B7').join('\\u00B7');
for (const [re, replacement] of replacements) {
  nav = nav.replace(re, replacement);
}
nav = nav.replace(/\uD83D\uDD25/g, '\\uD83D\\uDD25');
nav = nav.replace(/\u2726/g, '\\u2726');
nav = nav.replace(/\u203A/g, '\\u203A');
fs.writeFileSync(navPath, nav, 'utf8');
console.log('nav-strip.js: mojibake replaced with escapes');
