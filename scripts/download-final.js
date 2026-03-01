'use strict';
const https = require('https');
const fs = require('fs');
const path = require('path');
const assetsDir = path.join(__dirname, '..', 'interfaces', 'assets');

function dl(url, dest) {
  return new Promise((resolve, reject) => {
    const opts = { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 20000 };
    https.get(url, opts, res => {
      if (res.statusCode !== 200) { res.resume(); return reject(new Error('HTTP ' + res.statusCode)); }
      const out = fs.createWriteStream(dest);
      res.pipe(out);
      out.on('finish', () => resolve(Math.round(fs.statSync(dest).size / 1024) + 'KB'));
      out.on('error', reject);
    }).on('error', reject).on('timeout', function () { this.destroy(); reject(new Error('timeout')); });
  });
}

const tasks = [
  // Eldorado Novi — nightclub/lounge vibe
  { url: 'https://images.unsplash.com/photo-1571019613576-2b22c76fd955?w=800&h=560&fit=crop&q=85', dest: 'destinations-eldorado-novi.jpg' },
  // Matt Heron backup river shot
  { url: 'https://mattheronflyfishing.com/wp-content/uploads/2022/07/288994938_5574156232604215_2667663887750051174_n-1-1024x768.jpg', dest: 'destinations-matt-heron-fly-fishing-2.jpg' },
];

(async () => {
  for (const t of tasks) {
    const full = path.join(assetsDir, t.dest);
    try {
      const sz = await dl(t.url, full);
      console.log('OK', t.dest, sz);
    } catch (e) {
      console.log('ERR', t.dest, e.message);
      if (fs.existsSync(full)) fs.unlinkSync(full);
    }
  }
  // list all destinations assets
  const all = fs.readdirSync(assetsDir).filter(f => f.startsWith('destinations-'));
  console.log('\nAll destinations assets:');
  all.forEach(f => {
    const sz = Math.round(fs.statSync(path.join(assetsDir, f)).size / 1024);
    console.log(' ', f, sz + 'KB');
  });
})();
