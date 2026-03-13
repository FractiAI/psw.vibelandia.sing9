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
