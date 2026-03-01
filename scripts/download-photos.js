'use strict';
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const assetsDir = path.join(__dirname, '..', 'interfaces', 'assets');

function downloadImg(url, dest) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    const opts = { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120', Referer: new URL(url).origin }, timeout: 25000 };
    const req = mod.get(url, opts, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const next = res.headers.location.startsWith('http') ? res.headers.location : new URL(res.headers.location, url).href;
        return downloadImg(next, dest).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) return reject(new Error('HTTP ' + res.statusCode));
      const ct = res.headers['content-type'] || '';
      if (!ct.includes('image') && !ct.includes('octet')) return reject(new Error('Not image: ' + ct));
      const out = fs.createWriteStream(dest);
      res.pipe(out);
      out.on('finish', () => { const st = fs.statSync(dest); resolve({ dest: path.basename(dest), size: Math.round(st.size / 1024) + 'KB' }); });
      out.on('error', reject);
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
  });
}

// Best candidates selected by inspection:
// Matt Heron: large landscape fishing action shots (Facebook/Instagram uploads)
// Steamboat: actual facility photos
// Wide Open: actual lodge/hunting photos
// Black Rabbit Mead: no website → try Unsplash high-quality mead/meadery
// Eldorado Novi: try Caesars asset URLs with common filename patterns

const downloads = [

  // ── MATT HERON FLY FISHING ─────────────────────────────────────────────
  // Landscape 1024x768 shots from their gallery (social media uploads = real field photos)
  {
    name: 'destinations-matt-heron-fly-fishing',
    ext: 'jpg',
    url: 'https://mattheronflyfishing.com/wp-content/uploads/2022/07/291560456_5586081974744974_7129008664600331634_n-1024x768.jpg',
  },

  // ── STEAMBOAT HOT SPRINGS ──────────────────────────────────────────────
  // Main outdoor pool photo (outdoor soaking, the "dow_67168" shot)
  {
    name: 'destinations-steamboat-hot-springs',
    ext: 'jpg',
    url: 'https://steamboatsprings.org/wp-content/uploads/2020/08/dow_67168-copy.jpg',
  },
  // Backup: newer DSC professional shots
  {
    name: 'destinations-steamboat-hot-springs-2',
    ext: 'jpg',
    url: 'https://steamboatsprings.org/wp-content/uploads/2024/08/DSC_2317.jpg',
  },

  // ── WIDE OPEN OUTFITTERS ───────────────────────────────────────────────
  // Main hero image from their site (hunting in Mexico)
  {
    name: 'destinations-wideopen-outfitters',
    ext: 'jpg',
    url: 'https://wideopenoutfitters.com/wp-content/uploads/2025/02/image-06.jpg',
  },
  // Lodge shot: OSO-0256
  {
    name: 'destinations-wideopen-lodge',
    ext: 'jpg',
    url: 'https://wideopenoutfitters.com/wp-content/uploads/2025/02/OSO-0256.jpeg',
  },

  // ── BLACK RABBIT MEAD (no website) ────────────────────────────────────
  // High-quality free-use mead/craft beverage image from Unsplash (free commercial use)
  {
    name: 'destinations-black-rabbit-mead',
    ext: 'jpg',
    url: 'https://images.unsplash.com/photo-1567529684892-09290a1b2d05?w=800&h=560&fit=crop&q=85',
  },

  // ── ELDORADO RENO / NOVI NIGHTCLUB ────────────────────────────────────
  // Try Caesars CDN with various likely filenames
  {
    name: 'destinations-eldorado-reno',
    ext: 'jpg',
    url: 'https://www.caesars.com/content/dam/properties/eldorado-reno/hero/eldorado-reno-hero.jpg',
  },
];

(async () => {
  const results = [];
  for (const d of downloads) {
    const dest = path.join(assetsDir, d.name + '.' + d.ext);
    try {
      const info = await downloadImg(d.url, dest);
      console.log('✓', info.dest, info.size);
      results.push({ name: d.name, file: d.name + '.' + d.ext, url: d.url, ok: true });
    } catch(e) {
      console.log('✗', d.name, e.message);
      if (fs.existsSync(dest)) fs.unlinkSync(dest);
      results.push({ name: d.name, url: d.url, ok: false, err: e.message });
    }
  }
  console.log('\nResults:');
  results.forEach(r => console.log(r.ok ? '✓' : '✗', r.name));
})();
