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

  /* All paths are absolute from site root (works from any depth) */
  var NAV_ITEMS = [
    { label: 'Home',              href: '/index.html',                    match: /^\/(?:index\.html)?$/ },
    { label: 'A2A',               href: '/interfaces/sol-v.html',         match: /sol-v/ },
    { label: 'Vibers',            href: '/interfaces/vibers-menu.html',   match: /vibers-menu/ },
    { label: 'Office Hours',      href: '/interfaces/office-hours.html',  match: /office-hours/ },
    { label: 'Launch Pad',        href: '/interfaces/launch-pad.html',    match: /launch-pad/ },
    { label: my('Whiteboard'),    href: '/interfaces/my-whiteboard.html', match: /my-whiteboard/ },
    { label: 'Advertise',         href: '/interfaces/advertise.html',     match: /advertise/ },
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
    '#sing9-nav .nav-sep{',
      'width:1px;height:12px;',
      'background:rgba(212,175,55,0.15);',
      'flex-shrink:0;',
    '}',
    /* Body padding so content isn't hidden behind both strips */
    'body{padding-bottom:calc(36px + var(--ticker-h,0px) + env(safe-area-inset-bottom)) !important;}',
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
    nav.appendChild(a);
  });

  document.body.appendChild(nav);

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
        'bottom:calc(36px + var(--ticker-h,0px) + env(safe-area-inset-bottom) + 0.45rem);',
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
    widget.title = 'Live visitor count · SING!9 StoryStream';
    widget.innerHTML = '<span class="vc-dot"></span><span id="sing9-vc-n">···</span>';
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
        if (count == null) return;
        document.getElementById('sing9-vc-n').textContent = fmtCount(count) + ' visitors';
        widget.style.opacity = '1';
      })
      .catch(function () { /* silently hide on error */ });
  })();

})();
