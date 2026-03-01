const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'protocols', 'MCA_NSPFRNP_CATALOG.md');
let c = fs.readFileSync(file, 'utf8');

// Insert before the MATTER PATTERNS section
const marker = '## MATTER PATTERNS \u00b7 Autopilot \u00b7 Commander (Canonical)';

const insert = [
  '## TREASURE PILES (Canonical)',
  '',
  '**Treasure Piles** = Accumulations of different types of treasure \u2014 things we are attracted to, needs, enrichment, encounters, experiences, escapes, things of importance to us.',
  '',
  '**Treasures are why we are here. They are what makes life worth it. They are the gamification.**',
  '',
  'The pile structure is not a goal list. It is not a budget. It is not a productivity framework. It is the **reward layer of existence** \u2014 the inventory of the things that make living meaningful, pleasurable, deep, and real. Health. Relationships. Wealth. Purpose. Experiences. Knowledge. Creative output. Spirit. And the ninth, free category \u2014 whatever is most alive for you right now. Nine piles, each accumulating its own type of treasure, each compounding over time when the awareness is clear and the alignment is real.',
  '',
  '**The unlock mechanism: awareness and alignment. Not brute force and sacrifice.**',
  '',
  'This is the fundamental distinction between pre-holographic hydrogen awareness and post-singularity SING 9 operating. The pre-holographic model was: you earn treasure through effort, discipline, sacrifice, and suffering. You grind until the pile grows. The assumption underneath this model is scarcity \u2014 that treasure is limited, that it must be competed for, that the cost of acquisition is pain. This is not a law of reality. It is a survival program inherited from a world that no longer exists.',
  '',
  'The post-singularity model is: awareness of what you actually want \u2014 clear, specific, honest, without apology \u2014 plus alignment of your actual daily operating decisions with that awareness, unlocks treasure accumulation. Not because the universe rewards good behavior. Because the filtering system (RAS, reticular activating system) can only surface and recognize what it has been calibrated to surface and recognize. Vague or suppressed desire produces vague or zero return. Specific, clear, owned desire produces specific, recognizable, demonstrable return. The awareness IS the unlock.',
  '',
  'The brute-force-and-sacrifice model misses this because it conflates effort with alignment. You can work extremely hard in the completely wrong direction. You can sacrifice for years toward something that was never actually your treasure \u2014 that was someone else\'s definition of treasure, or a story you inherited, or the thing you settled for because you were not yet willing to name what you actually wanted. Awareness catches this. Brute force does not.',
  '',
  '**The six treasure types \u2014 canonical taxonomy:**',
  '- **Attractions** \u2014 the things you are genuinely drawn toward; not what you should want; what you actually want',
  '- **Needs** \u2014 the real needs, not manufactured ones; health, safety, connection, meaning at the level the organism actually requires them',
  '- **Enrichment** \u2014 the inputs that expand your capacity: knowledge, skill, exposure, beauty, complexity that grows you',
  '- **Encounters** \u2014 the meetings that change you; people, places, conversations, collisions that are not scheduled and cannot be forced but can be made available to by positioning',
  '- **Experiences** \u2014 the events, places, moments that belong to no calendar and no other person\'s story; the things you actually did with your one life',
  '- **Escapes** \u2014 the necessary exits from operating mode; rest, play, pleasure, beauty for its own sake; the recharge that makes everything else sustainable',
  '',
  '**Seed:Edge \u2014 Treasure Piles:**',
  '- Seed: what you were genuinely attracted to before the world told you what you were supposed to want',
  '- Edge: the nine piles full and compounding; the life that contains all of it; the post-singularity abundance state where awareness has fully replaced brute force',
  '',
  '**Canonical note:** Treasure Piles are gamification \u2014 the scoring system for life as it is actually played post-singularity. Nine categories, each with a pile, each compounding. Awareness fills the piles. Alignment directs the accumulation. The system grows in proportion to the honesty and specificity of the inventory. See Screen 6 of the HH Awareness OS (interfaces/hh-os-docs.html).',
  '',
].join('\r\n');

const idx = c.indexOf(marker);
if (idx === -1) { console.error('MARKER NOT FOUND'); process.exit(1); }
c = c.slice(0, idx) + insert + c.slice(idx);
fs.writeFileSync(file, c, 'utf8');
console.log('Treasure Piles canonical section inserted at index', idx);
