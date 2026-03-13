'use strict';
const fs = require('fs');
const path = require('path');

const i18nPath = path.join(__dirname, '..', 'interfaces', 'i18n.js');
let s = fs.readFileSync(i18nPath, 'utf8');

// Replace by key + suffix to avoid encoding issues
s = s.replace(/'vibers\.tip\.cashapp'\s*:\s*'[^']*Tip via Cash App'/g,
  "'vibers.tip.cashapp' : '\\uD83D\\uDCB5 Tip via Cash App'");
s = s.replace(/'vibers\.tip\.cashapp'\s*:\s*'[^']*Propina via Cash App'/g,
  "'vibers.tip.cashapp' : '\\uD83D\\uDCB5 Propina via Cash App'");
s = s.replace(/'vibers\.tip\.venmo'\s*:\s*'[^']*Tip via Venmo'/g,
  "'vibers.tip.venmo'   : '\\uD83D\\uDCB3 Tip via Venmo'");
s = s.replace(/'vibers\.tip\.venmo'\s*:\s*'[^']*Propina via Venmo'/g,
  "'vibers.tip.venmo'   : '\\uD83D\\uDCB3 Propina via Venmo'");
s = s.replace(/'landing\.intel_goliath'\s*:\s*'[^']*MELTGATE \\u00B7 Live Datacenter Temps'/g,
  "'landing.intel_goliath' : '\\uD83D\\uDD25 MELTGATE \\u00B7 Live Datacenter Temps'");
s = s.replace(/'landing\.doc_technical'\s*:\s*'[^']*Technical Manual'/g,
  "'landing.doc_technical': '\\uD83D\\uDD2C Technical Manual'");
s = s.replace(/'landing\.doc_technical'\s*:\s*'[^']*Manual T[^']*cnico'/g,
  "'landing.doc_technical': '\\uD83D\\uDD2C Manual T\\u00E9cnico'");

fs.writeFileSync(i18nPath, s);
console.log('i18n emoji/mojibake fixed');

// nav-strip.js
const navPath = path.join(__dirname, '..', 'nav-strip.js');
let nav = fs.readFileSync(navPath, 'utf8');
nav = nav.replace(/\{ label: '[^']*HFCS'/g, "{ label: '\\u25C8 HFCS'");
nav = nav.replace(/\{ label: '[^']*MELTGATE'/g, "{ label: '\\uD83D\\uDD25 MELTGATE'");
nav = nav.replace(/'[^']*HFCS': '[^']*'/g, "'\\u25C8 HFCS': '\\u25C8 HFCS'");
nav = nav.replace(/'[^']*MELTGATE': '[^']*'/g, "'\\uD83D\\uDD25 MELTGATE': '\\uD83D\\uDD25 MELTGATE'");
fs.writeFileSync(navPath, nav);
console.log('nav-strip emoji/mojibake fixed');

// Fix HTML files: replace mojibake with actual Unicode characters (HTML shows them when file is UTF-8)
const htmlMojibakeToChar = [
  ['\u00E2\u20AC\u201C', '\u2014'],   // â€" → —
  ['\u00E2\u20AC\u2013', '\u2014'],   // â€" (en-dash) → —
  ['\u00E2\u2020\u2019', '\u2192'],   // â†' → →
  ['\u00C2\u00B7', '\u00B7'],         // Â· → ·
  ['\u00E2\u02C6\u017E\u00E2\u00B9', '\u221E\u2079'], // âˆžâ¹ → ∞⁹
  ['\u00E2\u2014\u02C6', '\u25C8'],   // â—ˆ → ◈
  ['\u00F0\u0178\u201C\u00A5', '\uD83D\uDD25'], // ðŸ"¥ → 🔥
  ['\u00F0\u0178\u0022\u00A5', '\uD83D\uDD25'],
  ['\u00F0\u0178\u201C\u2013', '\uD83D\uDCD6'], // ðŸ"– → 📖
  ['\u00F0\u0178\u201C\u00AC', '\uD83D\uDD2C'], // ðŸ"¬ → 🔬
  ['\u00E2\u00AC\u00A1', '\u2B21'],   // â¬¡ → ⬡
  ['\u00E2\u0161\u00A1', '\u26A1'],   // âš¡ → ⚡
  ['\u00F0\u0178\u017D\u201C', '\uD83C\uDF0F'],   // ðŸŽ" → 🎓 (globe)
  ['\u00F0\u0178\u0022\u00AC', '\uD83D\uDD2C'],   // ðŸ"¬ (straight quote) → 🔬
];
const htmlFiles = [
  path.join(__dirname, '..', 'interfaces', 'hh-os-docs.html'),
];
for (const htmlPath of htmlFiles) {
  if (!fs.existsSync(htmlPath)) continue;
  let html = fs.readFileSync(htmlPath, 'utf8');
  for (const [from, to] of htmlMojibakeToChar) {
    html = html.split(from).join(to);
  }
  // Section pills: replace any mojibake before " Technical Manual" / " Onboarding Program"
  html = html.replace(/section-pill pill-tm">[^<]*Technical Manual<\/div>/, 'section-pill pill-tm">\uD83D\uDD2C Technical Manual</div>');
  html = html.replace(/section-pill pill-ob">[^<]*Onboarding Program<\/div>/, 'section-pill pill-ob">\uD83C\uDF0F Onboarding Program</div>');
  fs.writeFileSync(htmlPath, html);
  console.log('hh-os-docs.html: mojibake replaced with Unicode chars');
}
