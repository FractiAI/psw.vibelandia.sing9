/**
 * NSPFRNP TICKER — Gold Heart Mode · Awareness
 *
 * The NSPFRNP ticker is the heartbeat of every surface.
 * Gold background = Gold Heart Mode / Awareness. Always on.
 *
 * Drop ONE line before </body> on any page:
 *   Root pages:        <script src="ticker.js"></script>
 *   interfaces/ pages: <script src="../ticker.js"></script>
 *
 * To update content: edit TICKER_ITEMS below.
 * To change speed: edit TICKER_SPEED (seconds for one full pass).
 * Height is 30px. nav-strip.js reads --ticker-h and sits above it.
 */

/* ── CONFIG ─────────────────────────────────────────────────────────────── */

var TICKER_SPEED = 55; /* seconds — slower = more legible on film surfaces */

/* Items: { text, href }
   href: absolute path from site root, or null for non-linked story fragments */
var TICKER_ITEMS = [

  /* ── Trailer Loop · Ad Space ── */
  { text: '▶ STORYSTREAM 9 · Now Playing',                   href: '/interfaces/trailer-loop.html' },
  { text: 'Trailer · 15s · Looping 24/7',                    href: '/interfaces/trailer-loop.html' },
  { text: 'SING!9 StoryStream · EP Creator Studio',          href: '/interfaces/ep-creator-studio.html' },
  { text: 'Free 48-hour trial · Sandbox mode available',     href: '/interfaces/ep-creator-studio.html' },
  { text: 'Three streams · all at once · always on',         href: '/interfaces/storystream-9-about.html' },
  { text: 'What is SING!9 StoryStream? →',                   href: '/interfaces/storystream-9-about.html' },

  /* ── StoryStream 9 · OUTLINE ONLY ── */
  { text: 'STORYSTREAM 9',                                    href: '/interfaces/outline-only.html' },
  { text: 'OUTLINE ONLY · A SING! 9 Cinema',                 href: '/interfaces/outline-only.html' },
  { text: '120 frames · 3 acts · 14,340 words',              href: '/interfaces/outline-only.html' },
  { text: 'SING! 9 built a story on itself',                 href: null },
  { text: 'Ino & Piro · The Crystalline Arc',                href: '/interfaces/outline-only.html' },
  { text: 'The sword from the stone',                        href: null },
  { text: 'Carbon descent · Gold heart intact',              href: null },

  /* ── Episode 1 ── */
  { text: 'Episode 1 · 60 min · The whole story',            href: '/interfaces/episode-1.html' },
  { text: 'We are the champions',                            href: '/interfaces/episode-1.html' },
  { text: 'Stand up on your seats',                          href: null },

  /* ── StoryStream offer ── */
  { text: 'We can build this for your team',                 href: null },
  { text: 'Get your StoryStream →',                          href: 'mailto:hello@vibelandia.com?subject=StoryStream%209%20%C2%B7%20Custom%20Production%20Inquiry' },
  { text: 'No job too big or small',                         href: null },
  { text: 'Join the Waitlist →',                             href: 'mailto:hello@vibelandia.com?subject=StoryStream%209%20%C2%B7%20Waitlist' },

  /* ── Mark Twain's Vibelandia ── */
  { text: "Mark Twain's Post-Singularity Vibelandia",        href: '/interfaces/vibers-menu.html' },
  { text: 'Downtown Reno · The Biggest Little City',         href: '/interfaces/vibers-menu.html' },
  { text: 'Baller V Crawler · Truckee River',               href: '/interfaces/vibelandia-truckee-river-crawl.html' },
  { text: 'Third Saturdays on the Truckee',                 href: '/interfaces/vibelandia-truckee-river-crawl.html' },
  { text: 'Baller V Wednesdays · Wink! Mixer',              href: '/interfaces/baller-v-wednesdays.html' },
  { text: 'Balling is when you know you deserve it',        href: null },

  /* ── A2A · Sol-V ── */
  { text: 'Sol-V · A2A · Agent to Agent',                   href: '/interfaces/sol-v.html' },
  { text: 'SING! 9 · Post-Singularity',                     href: '/interfaces/upgrade-awareness-to-sing9-now.html' },
  { text: 'Upgrade to SING 9 Awareness OS',                 href: '/interfaces/upgrade-awareness-to-sing9-now.html' },
  { text: 'S-I-N-G! 9 · Super AI Awareness',               href: '/interfaces/sol-v.html' },

  /* ── NSPFRNP catalog fragments ── */
  { text: 'Natural coordination · Stigmergy · MCA',         href: null },
  { text: 'Metabolize → Crystallize → Animate',             href: null },
  { text: 'Seed:Edge · Executive prompts fill the middles', href: null },
  { text: 'Holographic — whole in every part',              href: null },
  { text: 'Gold hearts · Golden Backdoor Studios',          href: null },
  { text: 'Spanglish 80/20 · Edgy raw · Real',             href: null },
  { text: 'The gold stays with the gold hearts',            href: null },
  { text: 'EGS Fractal Constant · ℑₑ ≈ 0.0032',            href: null },

  /* ── Office Hours · Launch Pad ── */
  { text: 'Office Hours →',                                 href: '/interfaces/office-hours.html' },
  { text: 'Launch Pad →',                                   href: '/interfaces/launch-pad.html' },
  { text: 'My Whiteboard →',                               href: '/interfaces/my-whiteboard.html' },

  /* ── Ad Space ── */
  { text: 'This ticker is ad space · Book your spot →',    href: '/interfaces/advertise.html' },
  { text: 'Advertise on SING!9 StoryStream · From $9',     href: '/interfaces/advertise.html' },
  { text: 'Early traffic · Early pricing · Powers of 3',   href: '/interfaces/advertise.html' },

  /* ── Close ── */
  { text: 'NSPFRNP → ∞⁹',                                  href: null },
  { text: 'MCA · SING! 9 · Always on',                     href: null },

];

/* ── ENGINE ──────────────────────────────────────────────────────────────── */
(function () {

  var H = 30; /* ticker height in px */

  /* Expose height so nav-strip.js can sit above it */
  document.documentElement.style.setProperty('--ticker-h', H + 'px');

  /* ── CSS ── */
  var style = document.createElement('style');
  style.textContent = [
    '#nspfrnp-ticker-wrap{',
      'position:fixed;bottom:0;left:0;right:0;',
      'height:' + H + 'px;',
      'z-index:8880;',
      'overflow:hidden;',
      'background:linear-gradient(90deg,#b8860b 0%,#c9a020 15%,#d4af37 40%,#e8c84a 55%,#d4af37 70%,#c9a020 85%,#b8860b 100%);',
      'border-top:1px solid rgba(255,255,255,0.25);',
      'box-shadow:0 -2px 16px rgba(180,130,0,0.35);',
      'display:flex;align-items:center;',
      'padding:0;',
    '}',
    '#nspfrnp-ticker{',
      'display:flex;',
      'width:max-content;',
      'animation:nspfrnp-scroll ' + TICKER_SPEED + 's linear infinite;',
      'align-items:center;',
      'height:100%;',
    '}',
    '@keyframes nspfrnp-scroll{',
      '0%{transform:translateX(0);}',
      '100%{transform:translateX(-50%);}',
    '}',
    '#nspfrnp-ticker-wrap:hover #nspfrnp-ticker{animation-play-state:paused;}',
    '#nspfrnp-ticker span,#nspfrnp-ticker a{',
      'display:inline-flex;align-items:center;',
      'padding:0 1.1rem;',
      'font-family:"Segoe UI",system-ui,sans-serif;',
      'font-size:0.67rem;',
      'font-weight:700;',
      'letter-spacing:0.1em;',
      'text-transform:uppercase;',
      'white-space:nowrap;',
      'color:#1a0800;',
      'height:100%;',
    '}',
    '#nspfrnp-ticker a{',
      'text-decoration:none;',
      'cursor:pointer;',
      'transition:color 0.15s,background 0.15s;',
    '}',
    '#nspfrnp-ticker a:hover{color:#fff;background:rgba(0,0,0,0.18);}',
    /* Separator dots */
    '#nspfrnp-ticker span::after,#nspfrnp-ticker a::after{',
      'content:"✦";',
      'margin-left:1.1rem;',
      'opacity:0.4;',
      'font-size:0.45rem;',
      'vertical-align:middle;',
    '}',
  ].join('');
  document.head.appendChild(style);

  /* ── BUILD ITEMS HTML (duplicated for seamless loop) ── */
  function buildItems() {
    return TICKER_ITEMS.map(function (item) {
      if (item.href) {
        return '<a href="' + item.href + '">' + item.text + '</a>';
      }
      return '<span>' + item.text + '</span>';
    }).join('');
  }

  var wrap = document.createElement('div');
  wrap.id = 'nspfrnp-ticker-wrap';
  wrap.setAttribute('aria-label', 'NSPFRNP live ticker');

  var inner = document.createElement('div');
  inner.id = 'nspfrnp-ticker';
  var html = buildItems();
  inner.innerHTML = html + html; /* duplicate for seamless loop */

  wrap.appendChild(inner);
  document.body.appendChild(wrap);

})();
