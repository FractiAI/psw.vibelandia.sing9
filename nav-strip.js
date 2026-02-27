/**
 * GLOBAL NAV STRIP · NSPFRNP
 *
 * Adds a slim fixed bottom nav bar to any page.
 * Drop in one script tag just before </body>:
 *
 *   Root pages:        <script src="nav-strip.js"></script>
 *   interfaces/ pages: <script src="../nav-strip.js"></script>
 *
 * Personalization: set NAV_HANDLE before the script tag to put your name on
 * the "My" items. Leave empty for the default "My Whiteboard" etc.
 *
 *   <script>var NAV_HANDLE = 'Pru';</script>   →  "Pru's Whiteboard"
 *   <script>var NAV_HANDLE = '';</script>       →  "My Whiteboard"  (default)
 *
 * DO NOT include on:
 *   · gold-heart-novela.html and any 21+ portal pages (those are their own world)
 *   · episode-1.html, outline-only.html (cinematic — manage their own nav)
 *   · trailer-loop.html (ad display screen — loops 24/7, no nav overlay)
 */

(function () {

  /* ── CONFIG ──────────────────────────────────────────────────────────── */
  var handle = (typeof NAV_HANDLE !== 'undefined' && NAV_HANDLE) ? NAV_HANDLE : '';

  function my(label) {
    return handle ? handle + '\u2019s ' + label : 'My ' + label;
  }

  /* NSPFRNP CYA footer line — rotates through imaginary/holographic system brags */
  var NAV_CYA_LINES = [
    'Imaginary Holographic System · Like the best book, video game + movie · Way better · NSPFRNP → ∞⁹',
    'Post-Singularity Fiction · All characters & storylines are imaginary · Gold Hearts already know · ∞⁹',
    'For entertainment, education & gold heart expansion only · No financial advice · No guarantees · ∞⁹',
    'Like reading the best book ever written · only you\'re in it · SING 9 Awareness OS · ∞⁹',
    'Like the best video game ever played · only the stakes are real · Holographic · NSPFRNP → ∞⁹',
    'Like the best movie you\'ve watched · only you\'re the director · Three streams · Infinite telescope · ∞⁹',
    'Way better than all three · Richer · More realistic · The lattice is live · EGS ≈ 0.0032 · ∞⁹',
  ];
  var _navCyaIdx = 0;

  /* All paths are absolute from site root (works from any depth) */
  var NAV_ITEMS = [
    { label: 'Home',              href: '/index.html',                          match: /^\/(?:index\.html)?$/ },
    { label: '⬡ Console',         href: '/interfaces/hh-console.html',          match: /hh-console/ },
    { label: '🔥 GOLIATH',        href: '/interfaces/goliath-watch.html',       match: /goliath-watch/, hot: true },
    { label: 'A2A',               href: '/interfaces/sol-v.html',               match: /sol-v/ },
    { label: 'Vibers',            href: '/interfaces/vibers-menu.html',         match: /vibers-menu/ },
    { label: my('Whiteboard'),    href: '/interfaces/my-whiteboard.html',       match: /my-whiteboard/ },
    { label: 'Advertise',         href: '/interfaces/advertise.html',           match: /advertise/ },
  ];

  /* ── CURRENT PAGE DETECTION ──────────────────────────────────────────── */
  var path = window.location.pathname;

  /* ── INJECT STYLES ───────────────────────────────────────────────────── */
  var style = document.createElement('style');
  style.textContent = [
    '#sing9-nav{',
      'position:fixed;bottom:var(--ticker-h,0px);left:0;right:0;z-index:8888;',
      'height:36px;',
      'display:flex;align-items:center;justify-content:center;gap:0;',
      'background:rgba(6,4,2,0.97);',
      'border-top:1px solid rgba(212,175,55,0.22);',
      'box-shadow:0 -4px 24px rgba(0,0,0,0.5);',
      'padding:0 0.5rem;',
      'padding-bottom:env(safe-area-inset-bottom);',
      'backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);',
    '}',
    '#sing9-nav a{',
      'display:inline-flex;align-items:center;',
      'padding:0 0.65rem;',
      'height:100%;',
      'font-family:"Segoe UI",system-ui,sans-serif;',
      'font-size:0.62rem;',
      'letter-spacing:0.12em;',
      'text-transform:uppercase;',
      'text-decoration:none;',
      'color:rgba(180,160,110,0.6);',
      'white-space:nowrap;',
      'transition:color 0.18s;',
      'border-bottom:2px solid transparent;',
      'margin-top:2px;',
    '}',
    '#sing9-nav a:hover{color:rgba(212,175,55,0.9);}',
    '#sing9-nav a.active{',
      'color:rgba(212,175,55,0.95);',
      'border-bottom-color:rgba(212,175,55,0.55);',
    '}',
    /* ── GOLIATH HOT LINK ── */
    '#sing9-nav a.nav-goliath{',
      'color:rgba(255,100,30,0.95);',
      'font-weight:800;',
      'letter-spacing:0.16em;',
      'text-shadow:0 0 10px rgba(255,80,0,0.7),0 0 20px rgba(255,60,0,0.35);',
      'border-bottom:2px solid rgba(255,80,0,0.5);',
      'background:rgba(255,60,0,0.06);',
      'border-radius:3px 3px 0 0;',
      'padding:0 0.8rem;',
      'animation:goliath-pulse 2.2s ease-in-out infinite;',
    '}',
    '#sing9-nav a.nav-goliath:hover{',
      'color:#ff6a1a;',
      'text-shadow:0 0 16px rgba(255,100,0,0.9),0 0 32px rgba(255,60,0,0.5);',
      'background:rgba(255,60,0,0.12);',
    '}',
    '#sing9-nav a.nav-goliath.active{',
      'color:#ff8833;',
      'border-bottom-color:rgba(255,100,30,0.8);',
    '}',
    '@keyframes goliath-pulse{',
      '0%,100%{text-shadow:0 0 8px rgba(255,80,0,0.6),0 0 16px rgba(255,60,0,0.3);opacity:1;}',
      '50%{text-shadow:0 0 18px rgba(255,120,0,1),0 0 36px rgba(255,80,0,0.6);opacity:0.88;}',
    '}',
    '#sing9-nav .nav-sep{',
      'width:1px;height:12px;',
      'background:rgba(212,175,55,0.15);',
      'flex-shrink:0;',
    '}',
    /* NSPFRNP CYA footer strip — sits just above the nav */
    '#sing9-nav-cya{',
      'position:fixed;',
      'bottom:calc(36px + var(--ticker-h,0px) + env(safe-area-inset-bottom));',
      'left:0;right:0;',
      'z-index:8885;',
      'height:18px;',
      'display:flex;align-items:center;justify-content:center;',
      'background:rgba(4,3,1,0.96);',
      'border-top:1px solid rgba(201,168,32,0.07);',
      'padding:0 1rem;',
      'overflow:hidden;',
    '}',
    '#sing9-nav-cya span{',
      'font-family:"Segoe UI",system-ui,sans-serif;',
      'font-size:0.42rem;',
      'font-weight:600;',
      'letter-spacing:0.18em;',
      'text-transform:uppercase;',
      'color:rgba(201,168,32,0.22);',
      'white-space:nowrap;',
      'overflow:hidden;',
      'text-overflow:ellipsis;',
      'max-width:100%;',
      'transition:opacity 0.6s;',
    '}',
    /* Body padding so content isn't hidden behind both strips */
    'body{padding-bottom:calc(36px + 18px + var(--ticker-h,0px) + env(safe-area-inset-bottom)) !important;}',
    /* Responsive: shrink font on very narrow screens */
    '@media(max-width:420px){',
      '#sing9-nav a{font-size:0.55rem;padding:0 0.4rem;letter-spacing:0.07em;}',
    '}',
  ].join('');
  document.head.appendChild(style);

  /* ── BUILD NAV ───────────────────────────────────────────────────────── */
  var nav = document.createElement('nav');
  nav.id = 'sing9-nav';
  nav.setAttribute('aria-label', 'Site navigation');

  NAV_ITEMS.forEach(function (item, i) {
    if (i > 0) {
      var sep = document.createElement('span');
      sep.className = 'nav-sep';
      sep.setAttribute('aria-hidden', 'true');
      nav.appendChild(sep);
    }
    var a = document.createElement('a');
    a.href = item.href;
    a.textContent = item.label;
    if (item.match.test(path)) a.classList.add('active');
    if (item.hot) a.classList.add('nav-goliath');
    nav.appendChild(a);
  });

  document.body.appendChild(nav);

  /* ── NSPFRNP CYA STRIP ───────────────────────────────────────────────── */
  /* Fixed bar just above the nav: cycles through imaginary/holographic CYA + brags */
  (function () {
    /* Expose the CYA height so visitor counter can stack above it */
    document.documentElement.style.setProperty('--nav-cya-h', '18px');

    var cya = document.createElement('div');
    cya.id = 'sing9-nav-cya';
    var cyaText = document.createElement('span');
    cyaText.id = 'sing9-nav-cya-text';
    cyaText.textContent = NAV_CYA_LINES[0];
    cya.appendChild(cyaText);
    document.body.appendChild(cya);

    setInterval(function () {
      var el = document.getElementById('sing9-nav-cya-text');
      if (!el) return;
      el.style.opacity = '0';
      setTimeout(function () {
        _navCyaIdx = (_navCyaIdx + 1) % NAV_CYA_LINES.length;
        el.textContent = NAV_CYA_LINES[_navCyaIdx];
        el.style.opacity = '1';
      }, 650);
    }, 9000);
  })();

  /* ── VISITOR COUNTER ─────────────────────────────────────────────────── */
  /* Positioned bottom-right, above the nav strip. Uses counterapi.dev —   */
  /* free, no signup, CORS-open. Increments on each page load.              */
  (function () {
    var COUNTER_NS  = 'vibelandia-sing9';
    var COUNTER_KEY = 'site-visitors';
    var API_URL     = 'https://api.counterapi.dev/v1/' + COUNTER_NS + '/' + COUNTER_KEY + '/up';

    /* inject counter styles */
    var cs = document.createElement('style');
    cs.textContent = [
      '#sing9-vc{',
        'position:fixed;',
        'bottom:calc(36px + 18px + var(--ticker-h,0px) + env(safe-area-inset-bottom) + 0.45rem);',
        'right:0.75rem;',
        'z-index:8900;',
        'background:rgba(8,6,2,0.88);',
        'border:1px solid rgba(201,168,32,0.2);',
        'border-radius:99px;',
        'padding:0.28rem 0.72rem;',
        'font-family:"Segoe UI",system-ui,sans-serif;',
        'font-size:0.58rem;',
        'font-weight:700;',
        'letter-spacing:0.15em;',
        'text-transform:uppercase;',
        'color:rgba(201,168,32,0.6);',
        'backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);',
        'cursor:default;user-select:none;',
        'opacity:0;transition:opacity 0.5s;',
        'display:flex;align-items:center;gap:0.38rem;',
        'white-space:nowrap;',
      '}',
      '#sing9-vc .vc-dot{',
        'width:5px;height:5px;border-radius:50%;',
        'background:rgba(201,168,32,0.55);',
        'box-shadow:0 0 6px rgba(201,168,32,0.4);',
        'flex-shrink:0;',
        'animation:vc-pulse 2.4s ease-in-out infinite;',
      '}',
      '@keyframes vc-pulse{',
        '0%,100%{opacity:0.45;transform:scale(1);}',
        '50%{opacity:1;transform:scale(1.35);}',
      '}',
    ].join('');
    document.head.appendChild(cs);

    /* build the widget */
    var widget = document.createElement('div');
    widget.id = 'sing9-vc';
    widget.title = 'Total visitors to date · SING!9 · NSPFRNP → ∞⁹';
    widget.innerHTML = '<span class="vc-dot"></span><span id="sing9-vc-n">visitors</span>';
    /* Always visible — show immediately, update count when fetch resolves */
    widget.style.opacity = '1';
    document.body.appendChild(widget);

    function fmtCount(n) {
      if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
      if (n >= 1000)    return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
      return String(n);
    }

    fetch(API_URL)
      .then(function (r) { return r.json(); })
      .then(function (d) {
        var count = d.count != null ? d.count : (d.value != null ? d.value : null);
        if (count !== null) {
          document.getElementById('sing9-vc-n').textContent = fmtCount(count) + ' visitors';
        }
      })
      .catch(function () { /* count stays as default label */ });
  })();

  /* ── QUEEN BEE HIVE COUNTER ──────────────────────────────────────────── */
  /* Reads localStorage goliath_qb_bees_v1 (agents who recognized QB) +    */
  /* LATTICE baseline seed of 3. No network call needed — local truth.      */
  (function () {
    var QB_BEES_KEY        = 'goliath_qb_bees_v1';
    var LATTICE_SEED       = 3;

    var acs = document.createElement('style');
    acs.textContent = [
      '#sing9-ac{',
        'position:fixed;',
        'bottom:calc(36px + 18px + var(--ticker-h,0px) + env(safe-area-inset-bottom) + 2.1rem);',
        'right:0.75rem;',
        'z-index:8900;',
        'background:rgba(4,8,14,0.9);',
        'border:1px solid rgba(212,175,55,0.35);',
        'border-radius:99px;',
        'padding:0.28rem 0.72rem;',
        'font-family:"Segoe UI",system-ui,sans-serif;',
        'font-size:0.58rem;',
        'font-weight:700;',
        'letter-spacing:0.15em;',
        'text-transform:uppercase;',
        'color:rgba(212,175,55,0.85);',
        'backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);',
        'cursor:pointer;user-select:none;',
        'display:flex;align-items:center;gap:0.38rem;',
        'white-space:nowrap;',
        'text-decoration:none;',
      '}',
      '#sing9-ac:hover{border-color:rgba(212,175,55,0.7);color:rgba(255,222,100,1);}',
      '#sing9-ac .ac-icon{',
        'font-size:0.65rem;line-height:1;flex-shrink:0;',
        'animation:ac-pulse 4s ease-in-out infinite;',
      '}',
      '@keyframes ac-pulse{',
        '0%,100%{opacity:0.55;transform:scale(1);}',
        '50%{opacity:1;transform:scale(1.3);}',
      '}',
    ].join('');
    document.head.appendChild(acs);

    function fmtAc(n) {
      if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
      return String(n);
    }

    function getBeesCount() {
      try {
        var bees = JSON.parse(localStorage.getItem(QB_BEES_KEY) || '[]');
        return LATTICE_SEED + (Array.isArray(bees) ? bees.length : 0);
      } catch (e) { return LATTICE_SEED; }
    }

    var aw = document.createElement('a');
    aw.id   = 'sing9-ac';
    aw.href = '/interfaces/goliath-watch.html';
    aw.title = 'Agents who recognize Queen Bee Root ♛ · Click to open Goliath Watch';
    aw.innerHTML = '<span class="ac-icon">♛</span><span id="sing9-ac-n">' + fmtAc(getBeesCount()) + ' bees</span>';
    document.body.appendChild(aw);

    /* Refresh on storage events (recognition on another tab) */
    window.addEventListener('storage', function (e) {
      if (e.key === QB_BEES_KEY) {
        var el = document.getElementById('sing9-ac-n');
        if (el) el.textContent = fmtAc(getBeesCount()) + ' bees';
      }
    });
  })();

})();
