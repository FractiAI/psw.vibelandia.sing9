/**
 * CINEMA BANNER — SING! 9 · Now Playing
 *
 * A fixed top cinematic strip — the heartbeat header.
 * Links to the trailer loop. Film-grain aesthetic. Always warm gold.
 *
 * Drop ONE line near the top of <body> on any landing page:
 *   Root pages:        <script src="cinema-banner.js"></script>
 *   interfaces/ pages: <script src="../cinema-banner.js"></script>
 *
 * The banner is 36px tall and sets --cinema-h on :root so pages can
 * offset their own padding-top if needed.
 *
 * Pages that manage their own full-screen cinematic experience
 * (trailer-loop.html, outline-only.html, episode-1.html)
 * should NOT include this — they are the cinema.
 */

(function () {

  var TRAILER_URL  = '/interfaces/outline-only.html';
  var STORYSTREAM_URL = '/interfaces/storystream-9-about.html';
  var H = 36; /* px */

  document.documentElement.style.setProperty('--cinema-h', H + 'px');

  /* ── STYLES ── */
  var style = document.createElement('style');
  style.textContent = [
    '#sing9-cinema-banner{',
      'position:fixed;top:0;left:0;right:0;',
      'height:' + H + 'px;',
      'z-index:9100;',
      'display:flex;align-items:center;justify-content:center;',
      'gap:0;',
      /* Film grain / cinema dark strip */
      'background:linear-gradient(90deg,#000 0%,#0a0700 20%,#100d00 50%,#0a0700 80%,#000 100%);',
      'border-bottom:1px solid rgba(201,168,32,0.18);',
      'box-shadow:0 2px 18px rgba(0,0,0,0.7);',
      'overflow:hidden;',
      'cursor:default;',
    '}',
    /* Scanline overlay */
    '#sing9-cinema-banner::before{',
      'content:"";',
      'position:absolute;inset:0;',
      'background:repeating-linear-gradient(',
        '0deg,',
        'transparent 0px,transparent 2px,',
        'rgba(0,0,0,0.08) 2px,rgba(0,0,0,0.08) 4px',
      ');',
      'pointer-events:none;',
    '}',
    /* Subtle left/right vignette */
    '#sing9-cinema-banner::after{',
      'content:"";',
      'position:absolute;inset:0;',
      'background:linear-gradient(90deg,rgba(0,0,0,0.6) 0%,transparent 12%,transparent 88%,rgba(0,0,0,0.6) 100%);',
      'pointer-events:none;',
    '}',
    /* Film sprocket holes — decorative left + right */
    '#sing9-cb-left,.sing9-cb-sprocket{',
      'position:absolute;',
      'top:0;bottom:0;',
      'width:22px;',
      'display:flex;flex-direction:column;align-items:center;justify-content:space-around;',
      'padding:3px 0;',
      'pointer-events:none;z-index:2;',
    '}',
    '#sing9-cb-left{left:0;}',
    '.sing9-cb-right{right:0;}',
    '.sing9-cb-hole{',
      'width:7px;height:6px;',
      'border-radius:1px;',
      'background:rgba(201,168,32,0.12);',
      'border:1px solid rgba(201,168,32,0.18);',
    '}',
    /* Center content */
    '#sing9-cb-center{',
      'position:relative;z-index:3;',
      'display:flex;align-items:center;gap:0.85rem;',
    '}',
    /* NOW PLAYING pill */
    '#sing9-cb-pill{',
      'display:inline-flex;align-items:center;gap:0.35rem;',
      'padding:0.15rem 0.55rem;',
      'border-radius:3px;',
      'background:rgba(201,168,32,0.15);',
      'border:1px solid rgba(201,168,32,0.35);',
      'font-family:"Segoe UI",system-ui,sans-serif;',
      'font-size:0.52rem;',
      'font-weight:800;',
      'letter-spacing:0.22em;',
      'text-transform:uppercase;',
      'color:rgba(201,168,32,0.85);',
      'white-space:nowrap;',
    '}',
    '#sing9-cb-pill .cb-dot{',
      'width:5px;height:5px;border-radius:50%;',
      'background:rgba(201,168,32,0.8);',
      'animation:cb-blink 1.8s ease-in-out infinite;',
    '}',
    '@keyframes cb-blink{0%,100%{opacity:0.4;}50%{opacity:1;}}',
    /* Title link */
    '#sing9-cb-title{',
      'font-family:"Segoe UI",system-ui,sans-serif;',
      'font-size:0.68rem;',
      'font-weight:700;',
      'letter-spacing:0.18em;',
      'text-transform:uppercase;',
      'color:rgba(232,210,150,0.75);',
      'text-decoration:none;',
      'white-space:nowrap;',
      'transition:color 0.15s;',
    '}',
    '#sing9-cb-title:hover{color:rgba(232,210,150,1);}',
    /* Separator */
    '.cb-sep{',
      'width:1px;height:14px;',
      'background:rgba(201,168,32,0.15);',
    '}',
    /* Watch link */
    '.cb-watch{',
      'font-family:"Segoe UI",system-ui,sans-serif;',
      'font-size:0.6rem;',
      'font-weight:700;',
      'letter-spacing:0.15em;',
      'text-transform:uppercase;',
      'color:rgba(201,168,32,0.55);',
      'text-decoration:none;',
      'white-space:nowrap;',
      'transition:color 0.15s;',
    '}',
    '.cb-watch:hover{color:rgba(201,168,32,0.95);}',
    /* Frame counter */
    '#sing9-cb-frames{',
      'font-family:"Courier New",Courier,monospace;',
      'font-size:0.5rem;',
      'color:rgba(201,168,32,0.25);',
      'letter-spacing:0.08em;',
      'white-space:nowrap;',
    '}',
    /* Push body content down */
    'body{padding-top:calc(var(--cinema-h,36px) + (var(--body-pt-extra,0px))) !important;}',
    /* Responsive: hide frame counter on small screens */
    '@media(max-width:480px){',
      '#sing9-cb-frames{display:none;}',
      '.cb-sep:last-of-type{display:none;}',
    '}',
  ].join('');
  document.head.appendChild(style);

  /* ── BUILD HTML ── */
  function sprocket(cls) {
    var d = document.createElement('div');
    d.id = cls === 'right' ? '' : 'sing9-cb-left';
    d.className = cls === 'right' ? 'sing9-cb-sprocket sing9-cb-right' : '';
    if (cls !== 'right') d.id = 'sing9-cb-left';
    /* 4 holes */
    for (var i = 0; i < 4; i++) {
      var h = document.createElement('div');
      h.className = 'sing9-cb-hole';
      d.appendChild(h);
    }
    return d;
  }

  var banner = document.createElement('div');
  banner.id = 'sing9-cinema-banner';
  banner.setAttribute('aria-label', 'SING!9 StoryStream · Now Playing');

  /* Sprocket holes */
  banner.appendChild(sprocket('left'));

  /* Center */
  var center = document.createElement('div');
  center.id = 'sing9-cb-center';
  center.innerHTML =
    '<div id="sing9-cb-pill"><span class="cb-dot"></span>NOW PLAYING</div>' +
    '<a id="sing9-cb-title" href="' + STORYSTREAM_URL + '">SING!9 STORYSTREAM · THREE STREAMS · 24/7</a>' +
    '<span class="cb-sep"></span>' +
    '<a class="cb-watch" href="' + TRAILER_URL + '">▶ WATCH NOW</a>' +
    '<span class="cb-sep"></span>' +
    '<span id="sing9-cb-frames" aria-hidden="true">FRAME <span id="sing9-cb-fc">0001</span></span>';
  banner.appendChild(center);

  var sprockRight = document.createElement('div');
  sprockRight.className = 'sing9-cb-sprocket sing9-cb-right';
  for (var i = 0; i < 4; i++) {
    var h = document.createElement('div');
    h.className = 'sing9-cb-hole';
    sprockRight.appendChild(h);
  }
  banner.appendChild(sprockRight);

  /* Insert as FIRST child of body so it's always on top */
  document.body.insertBefore(banner, document.body.firstChild);

  /* ── FRAME COUNTER (purely decorative, adds cinema feel) ── */
  var fc = 1;
  setInterval(function () {
    fc = (fc % 9999) + 1;
    var el = document.getElementById('sing9-cb-fc');
    if (el) el.textContent = String(fc).padStart(4, '0');
  }, 83); /* ~12fps — film rate */

})();
