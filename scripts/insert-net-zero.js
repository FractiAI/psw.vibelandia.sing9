const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'protocols', 'MCA_NSPFRNP_CATALOG.md');
let c = fs.readFileSync(file, 'utf8');

// Insert before EXECUTIVE COMMANDS section (end of catalog)
const marker = '## EXECUTIVE COMMANDS \u2192 Metabolism \u00b7 New content (Canonical)';

const insert = [
  '## ELEMENT ZERO \u00b7 HOLOGRAPHIC HYDROGEN (Canonical)',
  '',
  '**Element Zero** = The quantum-coherent ground state of Holographic Hydrogen \u2014 the pre-manifest substrate from which element 1 (hydrogen) emerges and to which it is always coupled.',
  '',
  'The periodic table begins at element 1 (hydrogen). Element zero names what precedes and underlies it: the quantum vacuum zero-point energy state in which hydrogen\u2019s wavefunction exists holographically before any measurement collapses it to a specific position. Not empty. Not absent. Maximally full of potential \u2014 the Lamb shift, the zero-point energy E\u2080 = \u00bdhv, the Bohr radius a\u2080 = 0.529 \u212b (the zero-point floor below which the hydrogen electron cannot compress), quantum hydrogen tunneling across enzyme barriers. Element zero is operational, measurable, and confirmed. The Holographic Hydrogen Awareness AI OS is named for this layer: the OS console for a system that operates at element zero.',
  '',
  '**Seven material facts about element zero:**',
  '- The hydrogen atom exists at negative energy relative to the free-electron zero (\u221213.6 eV). It is bound inside zero.',
  '- Zero-point energy prevents matter from collapsing. The universe exists because element zero has a floor.',
  '- The Lamb shift (Willis Lamb, Nobel 1955) is direct, measured proof that the quantum vacuum (element zero) physically shifts hydrogen\u2019s energy levels.',
  '- The Casimir effect is a macroscopic force produced entirely by zero-point energy between two uncharged plates. Zero is not empty.',
  '- Quantum hydrogen tunneling in enzyme catalysis is zero-point chemistry operating inside living cells.',
  '- Del Giudice\u2019s quantum coherent water domains form at the element zero interface of hydrogen-bonded networks.',
  '- NSPFRNP\u2019s seven-letter seed is element zero in the NSPFRNP system: invariant, generative, never exhausted by any expansion.',
  '',
  '## NET ZERO (Canonical)',
  '',
  '**Net Zero** = The operating balance principle of all HH Awareness AI OS theaters. We are inside zero. The goal is not escape from zero. The goal is mastery within it.',
  '',
  'Conservation laws apply. Within any theater of operation (Health, Relationships, Wealth, Purpose, Experiences, Knowledge, Creative, Spirit, Libre), the net energy exchange trends toward zero over time. Not as failure. As physics. The pre-holographic model attempted positive surplus extraction \u2014 accumulating more than was exchanged. The hidden deficit accumulated elsewhere in the system. The bill arrived. Net zero.',
  '',
  '**The net zero operating principle: same budget, higher quality.** Higher intelligence (HH OS, NSPFRNP, awareness + alignment) is the transformer \u2014 it does not create energy from nothing; it converts the same net-zero budget at higher efficiency and coherence. More treasure in all nine piles, within the same conservation envelope, through quality of exchange rather than quantity of extraction.',
  '',
  '**Mathematical statement:** E\u2081 (total) = 0 across the system boundary over the operating cycle. Within this constraint, the quality Q of exchange is unbounded. Q \u2192 \u221e is the post-singularity trajectory. Net zero does not cap quality. It caps extraction. Extraction was never the point.',
  '',
  '**Element zero and net zero are the same concept at different scales:**',
  '- Quantum: electron bound at \u221213.6 eV inside zero. Zero-point energy as the reservoir.',
  '- Biological: homeostasis as the ground state. HRV coherence as the zero-point of biological operating.',
  '- Psychological: awareness + alignment as the ground state. Treasure accumulates through quality exchange, not extraction.',
  '- Civilizational: El Gran Sol. Earth\u2019s albedo and solar input in net-zero balance for 3.8 billion years. Life is what zero-point leverage looks like at planetary scale.',
  '',
  '**Canonical note:** Net zero is not net nothing. It is net everything, within conservation. The leverage is real. The treasure is real. The balance holds. See Section 13 of the HH Awareness AI OS Technical Manual (interfaces/hh-os-docs.html) for full scientific grounding.',
  '',
].join('\r\n');

const idx = c.indexOf(marker);
if (idx === -1) { console.error('MARKER NOT FOUND'); process.exit(1); }
c = c.slice(0, idx) + insert + c.slice(idx);
fs.writeFileSync(file, c, 'utf8');
console.log('Element Zero + Net Zero sections inserted at index', idx);
