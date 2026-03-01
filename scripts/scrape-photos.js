'use strict';
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const sites = [
  { name: 'matt-heron',   urls: ['https://mattheronflyfishing.com', 'https://mattheronflyfishing.com/truckee-river-guide-trips/'] },
  { name: 'steamboat',    urls: ['https://steamboatsprings.org', 'https://www.steamboatsprings.net', 'https://steamboatsprings.org/gallery/'] },
  { name: 'black-rabbit', urls: ['https://www.blackrabbitmeadery.com', 'https://blackrabbitmeadery.com', 'https://blackrabbitmeadery.com/menu/'] },
  { name: 'eldorado',     urls: ['https://www.caesars.com/eldorado-reno', 'https://www.caesars.com/eldorado-reno/hotel/gallery'] },
  { name: 'wideopen',     urls: ['https://wideopenoutfitters.com', 'https://wideopenoutfitters.com/gallery'] },
];

function fetchHtml(url) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    const opts = { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120' }, timeout: 12000 };
    const req = mod.get(url, opts, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchHtml(res.headers.location).then(resolve).catch(reject);
      }
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
  });
}

function extractImgs(html) {
  const imgs = [];
  // og:image meta tag
  const re1 = /og:image[^>]+content="(https?:\/\/[^"]+)"/g;
  const re1b = /og:image[^>]+content='(https?:\/\/[^']+)'/g;
  // img src
  const re2 = /img[^>]+src="(https?:\/\/[^"]+\.(jpg|jpeg|png|webp)[^"]*)"/g;
  const re2b = /img[^>]+src='(https?:\/\/[^']+\.(jpg|jpeg|png|webp)[^']*)'/ ;
  // srcset / data-src
  const re3 = /(?:data-src|srcset)="(https?:\/\/[^"]+\.(jpg|jpeg|png|webp)[^"]*)"/g;
  // background-image
  const re4 = /url\("?(https?:\/\/[^"')]+\.(jpg|jpeg|png|webp)[^"')]*)"?\)/g;
  for (const re of [re1, re1b, re2, re3, re4]) {
    let m;
    while ((m = re.exec(html)) !== null) imgs.push(m[1]);
  }
  return [...new Set(imgs)].filter(x => !/logo|icon|favicon|1x1|pixel|sprite|thumb/i.test(x));
}

async function downloadImg(url, dest) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    const opts = { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 15000 };
    const req = mod.get(url, opts, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadImg(res.headers.location, dest).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) return reject(new Error('HTTP ' + res.statusCode));
      const ct = res.headers['content-type'] || '';
      if (!ct.startsWith('image/')) return reject(new Error('Not image: ' + ct));
      const out = fs.createWriteStream(dest);
      res.pipe(out);
      out.on('finish', () => resolve(dest));
      out.on('error', reject);
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
  });
}

const assetsDir = path.join(__dirname, '..', 'interfaces', 'assets');

(async () => {
  const results = {};
  for (const s of sites) {
    let photos = [];
    for (const u of s.urls) {
      try {
        const html = await fetchHtml(u);
        photos = extractImgs(html);
        if (photos.length > 0) { console.log(s.name, '- found', photos.length, 'images from', u); break; }
      } catch(e) { console.log(s.name, 'err fetching', u, ':', e.message); }
    }
    if (photos.length === 0) { console.log(s.name, '- NO IMAGES FOUND'); continue; }
    // print top candidates
    console.log(s.name, 'top candidates:');
    photos.slice(0, 6).forEach((p, i) => console.log('  [' + i + ']', p));
    results[s.name] = photos;
  }
  // write results for next step
  fs.writeFileSync(path.join(__dirname, 'photo-candidates.json'), JSON.stringify(results, null, 2));
  console.log('\nCandidates written to scripts/photo-candidates.json');
})();
