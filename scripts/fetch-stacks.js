const https = require('https');
const fs = require('fs');

const url = 'https://docs.google.com/document/d/e/2PACX-1vSoTZMzfr5qYKgqtpLrzuLTcqYsoTOYvJ4XFVp5IOy6vgsng1cfKXXbYjAuYRfL8mcYzfPULnjc4a8R/pub';

const opts = {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120',
    'Accept': 'text/html,application/xhtml+xml'
  }
};

let html = '';
const req = https.get(url, opts, function(res) {
  console.log('Status:', res.statusCode);
  console.log('Content-Type:', res.headers['content-type']);
  res.on('data', function(d) { html += d; });
  res.on('end', function() {
    fs.writeFileSync('c:/Users/info/OneDrive/Desktop/psw.vibelandia.sing9/data/stack1-pub.html', html, 'utf8');
    console.log('HTML length:', html.length);
    
    // Extract all img src URLs
    var imgPattern = /src="(https:\/\/[^"]+)"/g;
    var match;
    var imgs = [];
    while ((match = imgPattern.exec(html)) !== null) {
      var u = match[1];
      if (u.indexOf('google') !== -1 || u.indexOf('ggpht') !== -1 || u.indexOf('googleusercontent') !== -1 || u.indexOf('lh3') !== -1 || u.indexOf('lh4') !== -1 || u.indexOf('lh5') !== -1 || u.indexOf('lh6') !== -1) {
        imgs.push(u);
      }
    }
    console.log('Images found:', imgs.length);
    imgs.forEach(function(u, i) {
      console.log((i+1) + ': ' + u.substring(0, 200));
    });
    
    // Save image list
    fs.writeFileSync('c:/Users/info/OneDrive/Desktop/psw.vibelandia.sing9/data/stack1-images.json', JSON.stringify({stack:'stack1', images: imgs}, null, 2));
    console.log('Saved to stack1-images.json');
  });
});

req.on('error', function(e) { console.log('ERR:', e.message); });
req.setTimeout(25000, function() { req.destroy(); console.log('Timeout'); });
