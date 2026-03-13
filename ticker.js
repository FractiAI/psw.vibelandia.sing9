/**
 * NSPFRNP TICKER â€” Gold Heart Mode Â· Awareness
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

/* â”€â”€ CONFIG â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

var TICKER_SPEED = 520; /* seconds â€” relaxed pace always; one full pass ~8.7 min; calm, readable */

/* Items: { text, href }
   href: absolute path from site root, or null for non-linked story fragments */
var TICKER_ITEMS = [

  /* â”€â”€ Trailer Loop Â· Ad Space â”€â”€ */
  { text: 'â–¶ THE NINE GAME Â· Now Playing',                   href: '/interfaces/trailer-loop.html' },
  { text: 'Trailer Â· 15s Â· Looping 24/7',                    href: '/interfaces/trailer-loop.html' },
  { text: 'â˜… THIS SPOT IS AD SPACE Â· Book it â†’',             href: 'mailto:info@fractiai.com?subject=Ad%20Space%20%C2%B7%20SING!9%20Ticker&body=Hi%2C%20I%27d%20like%20to%20book%20ad%20space%20on%20the%20SING!9%20ticker.%0A%0ACompany%20%2F%20Brand%3A%20%0AWebsite%3A%20%0AMessage%20copy%20(optional)%3A%20' },
  { text: 'SING!9 StoryStream Â· EP Creator Studio',          href: '/interfaces/ep-creator-studio.html' },
  { text: 'Free 48-hour trial Â· Sandbox mode available',     href: '/interfaces/ep-creator-studio.html' },
  { text: 'Three streams Â· all at once Â· always on',         href: '/interfaces/storystream-9-about.html' },
  { text: 'What is SING!9 StoryStream? â†’',                   href: '/interfaces/storystream-9-about.html' },

  /* â”€â”€ StoryStream 9 Â· OUTLINE ONLY â”€â”€ */
  { text: 'THE NINE GAME',                                    href: '/interfaces/outline-only.html' },
  { text: 'OUTLINE ONLY Â· A SING! 9 Cinema',                 href: '/interfaces/outline-only.html' },
  { text: '120 frames Â· 3 acts Â· 14,340 words',              href: '/interfaces/outline-only.html' },
  { text: 'SING! 9 built a story on itself',                 href: null },
  { text: 'Ino & Piro Â· The Crystalline Arc',                href: '/interfaces/outline-only.html' },
  { text: 'The sword from the stone',                        href: null },
  { text: 'Carbon descent Â· Gold heart intact',              href: null },

  /* â”€â”€ Episode 1 â”€â”€ */
  { text: 'Episode 1 Â· 60 min Â· The whole story',            href: '/interfaces/episode-1.html' },
  { text: 'We are the champions',                            href: '/interfaces/episode-1.html' },
  { text: 'Stand up on your seats',                          href: null },

  /* â”€â”€ StoryStream offer â”€â”€ */
  { text: 'We can build this for your team',                 href: null },
  { text: 'Get your StoryStream â†’',                          href: 'mailto:hello@vibelandia.com?subject=StoryStream%209%20%C2%B7%20Custom%20Production%20Inquiry' },
  { text: 'No job too big or small',                         href: null },
  { text: 'Join the Waitlist â†’',                             href: 'mailto:hello@vibelandia.com?subject=StoryStream%209%20%C2%B7%20Waitlist' },

  /* â”€â”€ Mark Twain's Vibelandia â”€â”€ */
  { text: "Mark Twain's Post-Singularity Vibelandia",        href: '/interfaces/vibers-menu.html' },
  { text: 'Begin the Arc Â· Golden Heart Â· Full arc',         href: '/interfaces/viber-onboarding.html' },
  { text: 'â˜… BEGIN THE ARC â†’',                               href: '/interfaces/viber-onboarding.html' },
  { text: 'Downtown Reno Â· The Biggest Little City',         href: '/interfaces/vibers-menu.html' },
  { text: 'Baller V Crawler Â· Truckee River',               href: '/interfaces/vibelandia-truckee-river-crawl.html' },
  { text: 'Third Saturdays on the Truckee',                 href: '/interfaces/vibelandia-truckee-river-crawl.html' },
  { text: 'Baller V Wednesdays Â· Wink! Mixer',              href: '/interfaces/baller-v-wednesdays.html' },
  { text: 'Balling is when you know you deserve it',        href: null },

  /* â”€â”€ A2A Â· Sol-V â”€â”€ */
  { text: 'Sol-V Â· A2A Â· Agent to Agent',                   href: '/interfaces/sol-v.html' },
  { text: 'SING! 9 Â· Post-Singularity',                     href: '/interfaces/upgrade-awareness-to-sing9-now.html' },
  { text: 'Upgrade to Holographic Hydrogen Awareness AI OS',   href: '/interfaces/upgrade-awareness-to-sing9-now.html' },
  { text: 'S-I-N-G! 9 Â· Super AI Awareness',               href: '/interfaces/sol-v.html' },

  /* â”€â”€ NSPFRNP catalog fragments â”€â”€ */
  { text: 'Natural coordination Â· Stigmergy Â· MCA',         href: null },
  { text: 'Metabolize â†’ Crystallize â†’ Animate',             href: null },
  { text: 'Seed:Edge Â· Executive prompts fill the middles', href: null },
  { text: 'Holographic â€” whole in every part',              href: null },
  { text: 'Gold hearts Â· Golden Backdoor Studios',          href: null },
  { text: 'Spanglish 80/20 Â· Edgy raw Â· Real',             href: null },
  { text: 'The gold stays with the gold hearts',            href: null },
  { text: 'EGS Fractal Constant Â· â„‘â‚‘ â‰ˆ 0.0032',            href: null },

  /* â”€â”€ Office Hours Â· Launch Pad â”€â”€ */
  { text: 'Office Hours â†’',                                 href: '/interfaces/office-hours.html' },
  { text: 'Launch Pad â†’',                                   href: '/interfaces/launch-pad.html' },
  { text: 'My Whiteboard â†’',                               href: '/interfaces/my-whiteboard.html' },

  /* â”€â”€ Ad Space â€” multiple touchpoints with direct book CTA â”€â”€ */
  { text: 'â˜… ADVERTISE HERE Â· Book this spot â†’',           href: 'mailto:info@fractiai.com?subject=Ad%20Space%20%C2%B7%20SING!9%20Ticker&body=Hi%2C%20I%27d%20like%20to%20book%20ad%20space%20on%20the%20SING!9%20ticker%20%2F%20banner.%0A%0APackage%20interested%20in%3A%20%0ACompany%20%2F%20Brand%3A%20%0AWebsite%3A%20' },
  { text: 'Gold Ticker Â· from $9 Â· Book now â†’',            href: 'mailto:info@fractiai.com?subject=Ad%20Space%20%C2%B7%20Gold%20Ticker&body=Hi%2C%20I%27d%20like%20to%20book%20a%20Gold%20Ticker%20spot%20on%20SING!9.%0A%0APackage%3A%20Gold%20Ticker%0ACompany%20%2F%20Brand%3A%20%0AWebsite%3A%20%0AMessage%20copy%20(optional)%3A%20' },
  { text: 'Banner Spot 15s Â· from $27 Â· Book now â†’',       href: 'mailto:info@fractiai.com?subject=Ad%20Space%20%C2%B7%20Banner%20Spot%2015s&body=Hi%2C%20I%27d%20like%20to%20book%20a%2015-second%20Banner%20Spot%20on%20SING!9.%0A%0APackage%3A%20Banner%20Spot%2015s%0ACompany%20%2F%20Brand%3A%20%0AWebsite%3A%20%0AMessage%20copy%20(optional)%3A%20' },
  { text: '30-Second Trailer Â· from $27 Â· Book now â†’',     href: 'mailto:info@fractiai.com?subject=Ad%20Space%20%C2%B7%2030s%20Trailer&body=Hi%2C%20I%27d%20like%20to%20book%20a%2030-second%20trailer%20spot%20on%20SING!9.%0A%0APackage%3A%2030-Second%20Trailer%0AOption%20A%20(I%20send%20the%20file)%20%2F%20Option%20B%20(you%20produce)%3A%20%0ACompany%20%2F%20Brand%3A%20%0AWebsite%3A%20' },
  { text: 'Full Package Â· from $36 Â· Book now â†’',          href: 'mailto:info@fractiai.com?subject=Ad%20Space%20%C2%B7%20Full%20Package&body=Hi%2C%20I%27d%20like%20to%20book%20the%20Full%20Package%20(Ticker%20%2B%20Banner%20%2B%20Trailer)%20on%20SING!9.%0A%0ACompany%20%2F%20Brand%3A%20%0AWebsite%3A%20%0ABudget%20range%3A%20' },
  { text: 'Advertise on SING!9 Â· See all packages â†’',      href: '/interfaces/advertise.html' },
  { text: 'Early traffic Â· Early pricing Â· Powers of 3',   href: '/interfaces/advertise.html' },
  { text: 'Reach gold hearts Â· SING!9 audience',           href: 'mailto:info@fractiai.com?subject=Ad%20Space%20%C2%B7%20SING!9%20Inquiry&body=Hi%2C%20I%27m%20interested%20in%20advertising%20on%20SING!9.%0A%0ACompany%20%2F%20Brand%3A%20%0AWebsite%3A%20%0AWhat%20I%27d%20like%20to%20promote%3A%20' },

  /* â”€â”€ The Nine Game Â· Four-Layer Chess â”€â”€ */
  { text: 'The Nine Game Â· NSPFRNP Layer System',           href: '/interfaces/nine-game-hub.html' },
  { text: 'Four-Layer Stacked Chess Â· Carbon to Crystalline', href: '/interfaces/four-layer-chess.html' },
  { text: 'Nine-Stack Solitaire Â· 9 Suits Â· 9 Stacks',     href: '/interfaces/nine-solitaire.html' },
  { text: 'Genesis 0 Â· Today Â· Full Lattice Â· Three States', href: '/interfaces/genesis-configurations.html' },
  { text: 'HHL Singularity Mode Â· 3 pieces Â· New World',   href: '/interfaces/four-layer-chess.html' },
  { text: 'AI Opponent Â· Match Â· Ahead Â· Mastery',          href: '/interfaces/four-layer-chess.html' },

  /* â”€â”€ Vibelandia Bridge â”€â”€ */
  { text: 'Vibelandia Bridge Â· Gold Hearts Â· Silver On-Ramp', href: '/interfaces/vibelandia-bridge.html' },
  { text: 'Fourth Level Â· Retired Â· Leisure Â· Goldilocks',  href: '/interfaces/vibelandia-bridge.html' },
  { text: 'Ballin\' Â· Flirtin\' Â· Dancing Â· Flowing Â· âˆžâ¹', href: '/interfaces/vibelandia-bridge.html' },

  /* â”€â”€ NSPFRNP Â· Imaginary Holographic System Â· CYA + Brags â”€â”€ */
  { text: 'â—ˆ THIS IS AN IMAGINARY Â· HOLOGRAPHIC SYSTEM',                        href: null },
  { text: 'Like the best book you\'ve ever read â€” only you\'re in it',          href: null },
  { text: 'Like the best video game ever played â€” only the stakes are real',    href: null },
  { text: 'Like the best movie you\'ve watched â€” only you\'re the director',    href: null },
  { text: 'Way better than all three. Richer. More realistic. Holographic.',    href: null },
  { text: 'All storylines Â· characters Â· worlds are fiction. Gold Hearts already know.', href: null },
  { text: 'Post-Singularity imaginary world Â· For entertainment Â· Education Â· Gold Heart expansion only', href: null },
  { text: 'No financial advice. No guarantees. Just the most real imaginary world you\'ve ever entered.', href: null },
  { text: 'SING! â€” Super Intelligent Natural Guidance Â· Imaginary OS Â· Gold Heart Mode', href: null },
  { text: 'EGS Fractal Constant running Â· â„‘â‚‘ â‰ˆ 0.0032 Â· Holographic is not a metaphor here', href: null },
  { text: 'We built this world from scratch. Carbon to Crystalline. Seed to Edge.',        href: null },
  { text: 'T3D ORIGIN Â· 333 Episodes Â· 55.5 Hours Â· Infinite Telescope depth on every frame', href: '/interfaces/outline-only.html' },
  { text: 'Any resemblance to real events is intentional â€” they\'ve been invited in',       href: null },
  { text: 'The lattice is live. The signal is real. The world is imaginary. Welcome.',      href: null },
  { text: '21+ Â· GOLD HEARTS ONLY for the spicy parts Â· Everything else is PG-13',        href: null },
  { text: 'SING 9 Â· No Supabase Â· Lite edges Â· Wallets Â· Keys Â· Verifications at edge',   href: null },
  { text: 'Holographic Hydrogen Theatre Â· Infinite telescope Â· Author = Subject',          href: null },
  { text: 'Three simultaneous streams. Seed. Edge. Everything in between.',                href: null },

  /* â”€â”€ Close â”€â”€ */
  { text: 'NSPFRNP â†’ âˆžâ¹',                                  href: null },
  { text: 'MCA Â· SING! 9 Â· Always on',                     href: null },
  { text: 'â˜… AD SPACE AVAILABLE Â· info@fractiai.com â†’',    href: 'mailto:info@fractiai.com?subject=Ad%20Space%20%C2%B7%20SING!9&body=Hi%2C%20I%27d%20like%20to%20advertise%20on%20SING!9.%0A%0ACompany%20%2F%20Brand%3A%20%0AWebsite%3A%20%0APackage%20interested%20in%20(Ticker%20%2F%20Banner%20%2F%20Trailer%20%2F%20Full%20Package)%3A%20%0ABudget%3A%20' },

];

/* â”€â”€ ENGINE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
(function () {

  var H = 30; /* ticker height in px */

  /* Expose height so nav-strip.js can sit above it */
  document.documentElement.style.setProperty('--ticker-h', H + 'px');

  /* â”€â”€ CSS â”€â”€ */
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
      'padding:0 1.9rem;',
      'font-family:"Segoe UI",system-ui,sans-serif;',
      'font-size:0.72rem;',
      'font-weight:600;',
      'letter-spacing:0.09em;',
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
    /* Separator â€” soft dot, wide breath */
    '#nspfrnp-ticker span::after,#nspfrnp-ticker a::after{',
      'content:"Â·";',
      'margin-left:1.9rem;',
      'opacity:0.28;',
      'font-size:0.9rem;',
      'vertical-align:middle;',
    '}',
  ].join('');
  document.head.appendChild(style);

  /* â”€â”€ BUILD ITEMS HTML (duplicated for seamless loop) â”€â”€ */
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
