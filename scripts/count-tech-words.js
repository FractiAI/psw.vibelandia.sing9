const fs = require('fs');
const html = fs.readFileSync('interfaces/hh-os-docs.html', 'utf8');
const start = html.indexOf('id="technical"');
const end = html.indexOf('</section>', start) + '</section>'.length;
const section = html.slice(start, end);
const text = section.replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/g,' ').replace(/\s+/g,' ');
const words = text.trim().split(' ').filter(w => w.length > 1);
console.log('Technical Manual word count:', words.length);
