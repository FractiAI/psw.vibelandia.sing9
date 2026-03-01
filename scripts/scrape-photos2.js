'use strict';
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

function fetchHtml(url) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    const opts = { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120' }, timeout: 15000 };
    const req = mod.get(url, opts, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const next = res.headers.location.startsWith('http') ? res.headers.location : new URL(res.headers.location, url).href;
        return fetchHtml(next).then(resolve).catch(reject);
      }
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ html: data, status: res.statusCode, url }));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
  });
}

function extractImgs(html, baseUrl) {
  const imgs = [];
  // og:image
  const re0 = /property=.og:image.\s+content=["']([^"']+)/g;
  // img src containing jpg/jpeg/png/webp
  const re1 = /src=["'](https?:\/\/[^"'\s]+\.(?:jpg|jpeg|png|webp)[^"'\s]*)/gi;
  // data-src / data-lazy-src
  const re2 = /data-(?:src|lazy-src|srcset)=["'](https?:\/\/[^"'\s]+\.(?:jpg|jpeg|png|webp)[^"'\s]*)/gi;
  // background-image url
  const re3 = /url\(["']?(https?:\/\/[^"')]+\.(?:jpg|jpeg|png|webp)[^"')]*)/gi;
  // srcset
  const re4 = /srcset=["'](https?:\/\/[^"'\s,]+\.(?:jpg|jpeg|png|webp)[^"'\s,]*)/gi;
  for (const re of [re0, re1, re2, re3, re4]) {
    let m;
    while ((m = re.exec(html)) !== null) {
      const u = m[1].split(' ')[0].split(',')[0].trim();
      if (u.startsWith('http')) imgs.push(u);
    }
  }
  return [...new Set(imgs)].filter(x => !/logo|icon|favicon|1x1|pixel|sprite|avatar|rating|star|google|fb-|facebook|twitter/i.test(x));
}

async function downloadImg(url, dest) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    const opts = { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120', Referer: url }, timeout: 20000 };
    const req = mod.get(url, opts, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const next = res.headers.location.startsWith('http') ? res.headers.location : new URL(res.headers.location, url).href;
        return downloadImg(next, dest).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) return reject(new Error('HTTP ' + res.statusCode));
      const ct = res.headers['content-type'] || '';
      if (!ct.includes('image')) return reject(new Error('Not image: ' + ct));
      const out = fs.createWriteStream(dest);
      res.pipe(out);
      out.on('finish', () => { const st = fs.statSync(dest); resolve({ dest, size: st.size }); });
      out.on('error', reject);
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
  });
}

const assetsDir = path.join(__dirname, '..', 'interfaces', 'assets');

(async () => {
  // ── MATT HERON ── get the gallery / guide trips page for action shots
  console.log('\n== MATT HERON deep scan ==');
  const mhPages = [
    'https://mattheronflyfishing.com/truckee-river-guide-trips/',
    'https://mattheronflyfishing.com/gallery/',
    'https://mattheronflyfishing.com/photos/',
  ];
  let mhPhotos = [];
  for (const u of mhPages) {
    try {
      const { html } = await fetchHtml(u);
      const imgs = extractImgs(html, u).filter(x => /fly|fish|truckee|river|guide|catch|cast|angl|trout/i.test(x) || /wp-content\/uploads/i.test(x));
      if (imgs.length) { mhPhotos = imgs; console.log('  found', imgs.length, 'from', u); break; }
    } catch(e) { console.log('  ', u, e.message); }
  }
  // fallback: use main page wp-content images that look like photos
  if (!mhPhotos.length) {
    try {
      const { html } = await fetchHtml('https://mattheronflyfishing.com');
      mhPhotos = extractImgs(html).filter(x => /wp-content\/uploads.*\.jpg/i.test(x) && !/thumb|150x150|300x/i.test(x));
    } catch(e) {}
  }
  console.log('  Matt Heron best candidates:');
  mhPhotos.slice(0, 8).forEach((p, i) => console.log('   ', i, p));

  // ── ELDORADO ──
  console.log('\n== ELDORADO RENO ==');
  const eldoPages = [
    'https://www.caesars.com/eldorado-reno',
    'https://www.caesars.com/eldorado-reno/hotel',
    'https://www.caesars.com/eldorado-reno/entertainment',
    'https://eldorado.caesars.com',
  ];
  let eldoPhotos = [];
  for (const u of eldoPages) {
    try {
      const { html, status } = await fetchHtml(u);
      console.log('  ', u, 'status:', status);
      const imgs = extractImgs(html, u);
      const filtered = imgs.filter(x => /eldorado|casino|reno|nightlife|entertainment|hotel|resort/i.test(x) || /caesars.*dam/i.test(x));
      if (filtered.length || imgs.length) {
        eldoPhotos = filtered.length ? filtered : imgs;
        console.log('  found', eldoPhotos.length, 'filtered /', imgs.length, 'total');
        break;
      }
    } catch(e) { console.log('  ', u, e.message); }
  }
  console.log('  Eldorado best candidates:');
  eldoPhotos.slice(0, 6).forEach((p, i) => console.log('   ', i, p));

  // ── BLACK RABBIT MEAD ── try multiple domain possibilities
  console.log('\n== BLACK RABBIT MEAD ==');
  const brPages = [
    'https://www.blackrabbitmeadery.com',
    'https://blackrabbitmeadery.com',
    'https://blackrabbit.bar',
    'https://www.blackrabbit.bar',
    'https://blackrabbitmead.com',
    'https://www.blackrabbitmead.com',
  ];
  let brPhotos = [];
  for (const u of brPages) {
    try {
      const { html, status, url: finalUrl } = await fetchHtml(u);
      console.log('  ', u, '→', finalUrl, 'status:', status, 'html len:', html.length);
      if (status === 200 && html.length > 500) {
        const imgs = extractImgs(html, u);
        console.log('  imgs found:', imgs.length);
        imgs.slice(0, 5).forEach(x => console.log('   ', x));
        if (imgs.length) { brPhotos = imgs; break; }
      }
    } catch(e) { console.log('  ', u, e.message); }
  }

  console.log('\nDone.');
})();
