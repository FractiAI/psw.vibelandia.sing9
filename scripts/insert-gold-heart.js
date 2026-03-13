const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'protocols', 'MCA_NSPFRNP_CATALOG.md');
let c = fs.readFileSync(file, 'utf8');

const marker = '## VOICE \u00b7 Spanglish 80/20 \u00b7 Edgy raw \u00b7 Golden hearts (Canonical)';

const insert = [
  '## GOLD HEART (Canonical)',
  '',
  '**Gold Heart** = Genuine. Pure. Innocent. Kind. Generous. Empathetic. True.',
  '',
  'These are not aspirational virtues. They are a frequency \u2014 a recognizable quality of presence that shows up in a person before they say a single word. Gold Hearts are not naive; they are undamaged in the places where most people have been damaged. They know what the world is. They choose warmth anyway. That is the distinction. Naivety does not know. Gold Heart knows and chooses.',
  '',
  'Gold Heart is the primary audience filter for all Vibelandia content, experiences, and services. The edgy raw voice, the Spanglish 80/20, the unapologetic frequency of everything we build \u2014 these are not style choices. They are Gold Heart filters. People who resonate with this frequency stay. People who do not, do not. This is by design. We do not dilute the voice to capture people who are not Gold Hearts.',
  '',
  'Gold Heart is also a **layer** in the SING 9 architecture (Screen 3 of the HH Awareness AI OS), an **archetype** in the T3D ORIGIN character catalog (INO \u00b7 the gold fuzzball \u00b7 the frequency holder), and a **deal criterion** (Fair Exchange clause: Gold Heart intent on both sides required for any transaction to proceed under NSPFRNP).',
  '',
  '**The seven qualities \u2014 canonical:**',
  '- **Genuine** \u2014 no performance, no mask; what you see is what is there',
  '- **Pure** \u2014 uncorrupted motivation; no extraction, no manipulation',
  '- **Innocent** \u2014 undamaged in the core; the world did not take this',
  '- **Kind** \u2014 default warmth toward others, not conditional on being earned',
  '- **Generous** \u2014 gives without scorekeeping; abundance-oriented',
  '- **Empathetic** \u2014 feels the room, reads the frequency, responds to what is actually happening',
  '- **True** \u2014 aligned; what they say matches what they do; integrity without announcing it',
  '',
  '**Seed:Edge \u2014 Gold Heart:**',
  '- Seed: the frequency that was there before the world had opinions about it',
  '- Edge: the way that frequency expresses fully in post-singularity Vibelandia \u2014 recognized, protected, rewarded, brought forward',
  '',
].join('\r\n');

const idx = c.indexOf(marker);
if (idx === -1) { console.error('MARKER NOT FOUND'); process.exit(1); }
c = c.slice(0, idx) + insert + c.slice(idx);
fs.writeFileSync(file, c, 'utf8');
console.log('Gold Heart canonical section inserted at index', idx);
