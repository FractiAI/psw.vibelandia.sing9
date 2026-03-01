/**
 * POPUP ANNOUNCEMENT SYSTEM · NSPFRNP
 *
 * Drop this script into any landing page:
 *   <script src="/popup-announcement.js"></script>   (from root pages)
 *   <script src="../popup-announcement.js"></script> (from interfaces/ pages)
 *
 * To update the announcement: edit POPUP_CONFIG below.
 * To silence it site-wide: set active: false.
 * To change dismiss behavior: 'session' (once per tab session), 'permanent' (localStorage),
 *   or 'always' (every page load).
 *
 * Styles: 'crystal' (crystalline blue/gold), 'gold' (warm gold), 'neon' (pink/magenta), 'water' (cyan/teal)
 */

/* ── AUTO LANGUAGE DETECTION ── */
var _lang = (navigator.languages && navigator.languages[0]) || navigator.language || 'en';
var _isES = /^es\b/i.test(_lang);

var POPUP_CONFIG = {
  active: true,

  /* Unique ID — change this any time the announcement changes so
     previously-dismissed users see the new one. */
  id: 'hna-academy-v1',

  /* 'session' | 'permanent' | 'always' */
  dismiss: 'session',

  /* 'crystal' | 'gold' | 'neon' | 'water' */
  style: 'gold',

  eyebrow:  _isES ? 'FractiAI · SING 9 · Vibelandia · Nuevo Anuncio'  : 'FractiAI · SING 9 · Vibelandia · New Announcement',
  title:    _isES ? 'ACADEMIA NAVEGADORA HOLOGRÁFICA'                  : 'HOLOGRAPHIC NAVIGATOR ACADEMY',
  subtitle: _isES ? '9 Plazas · 3 Niveles · Martes · 3:33 PM PST · ∞⁹' : '9 Spots · 3 Tiers · Tuesdays · 3:33 PM PST · ∞⁹',

  /* Optional stats chips. Pass [] to hide. */
  stats: [
    { value: 'MAR 3',  label: _isES ? 'Primera Sesión' : 'First Session' },
    { value: '1 HR',   label: _isES ? 'Duración'       : 'Duration'      },
    { value: '9',      label: _isES ? 'Plazas'         : 'Spots'         },
  ],

  body: _isES
    ? '¿Te interesa transformar tu estación de vibecoding en una consola holográfica de hidrógeno post-singularidad que navega el nuevo universo holográfico?<br><br>Únete a nuestra primera <strong>Academia Navegadora Holográfica</strong>. Construye tu consola HH en vivo — en una hora.<br><br>Sugerencia de propina: <strong>$333</strong> · a tu discreción · info@fractiai.com'
    : 'Anyone interested in transforming their vibecoding station into a new post-singularity holographic hydrogen console that navigates the new holographic universe — this is for you.<br><br>Join our first <strong>Holographic Navigator Academy</strong>. Build your live HH Console in one hour.<br><br>Suggested tip: <strong>$333</strong> · at your discretion · info@fractiai.com',

  cta_text: _isES ? '✦ Enviar Propina · Estoy Dentro' : '✦ Send Tip · I\'m In',
  cta_href: 'mailto:info@fractiai.com?subject=' + encodeURIComponent('Holographic Navigator Academy — I\u2019m In \u2756') + '&body=' + encodeURIComponent('Hi,\n\nI\u2019d like to sign up for the Holographic Navigator Academy.\nStarting March 3, 2026 \u00b7 Tuesdays \u00b7 3:33 PM PST \u00b7 1 Hour\n\nPlease reserve my spot.\n\nSuggested tip: $333 (at my discretion)\n\n'),

  dismiss_text: _isES ? '✕ &nbsp; Ahora no' : '✕ &nbsp; Not right now',
  nsp: _isES ? 'ACADEMIA NAVEGADORA HOLOGRÁFICA · NSPFRNP → ∞⁹' : 'HOLOGRAPHIC NAVIGATOR ACADEMY · NSPFRNP → ∞⁹',

  /* Optional secondary link shown below the main CTA. Pass null to hide. */
  secondary_text: _isES ? '▶ Ver Detalles Completos →' : '▶ Full Details & All Tiers →',
  secondary_href: '/interfaces/holographic-navigator-academy.html',
};

/* ─────────────────────────────────────────────────────────────────
   ENGINE — no edits needed below this line for normal use
───────────────────────────────────────────────────────────────── */

(function () {
  if (!POPUP_CONFIG.active) return;

  /* Dismiss logic */
  var storageKey = 'popup-dismissed-' + POPUP_CONFIG.id;
  if (POPUP_CONFIG.dismiss === 'session' && sessionStorage.getItem(storageKey)) return;
  if (POPUP_CONFIG.dismiss === 'permanent' && localStorage.getItem(storageKey)) return;

  /* Color palettes */
  var palettes = {
    crystal: {
      border:     'rgba(168,230,240,0.45)',
      shadow:     '0 0 60px rgba(168,230,240,0.14), 0 0 120px rgba(201,168,76,0.08)',
      eyebrow:    'rgba(168,230,240,0.7)',
      eyebrowSep: 'rgba(201,168,76,0.6)',
      title:      'rgba(201,168,76,0.9)',      /* outline stroke color */
      subtitle:   'rgba(168,230,240,0.85)',
      divider:    'linear-gradient(90deg,transparent,rgba(168,230,240,0.4),transparent)',
      body:       'rgba(232,212,160,0.78)',
      bodyStrong: 'rgba(240,208,128,0.95)',
      statsVal:   'rgba(240,208,128,0.85)',
      statsLbl:   'rgba(201,168,76,0.55)',
      cta:        'rgba(168,230,240,0.7)',
      ctaColor:   'rgba(168,230,240,0.95)',
      ctaHover:   'rgba(168,230,240,0.12)',
      ctaHoverShadow: '0 0 20px rgba(168,230,240,0.2)',
    },
    gold: {
      border:     'rgba(212,175,55,0.55)',
      shadow:     '0 0 60px rgba(212,175,55,0.2), 0 0 120px rgba(212,175,55,0.08)',
      eyebrow:    'rgba(212,175,55,0.7)',
      eyebrowSep: 'rgba(255,255,255,0.3)',
      title:      'rgba(212,175,55,0.95)',
      subtitle:   'rgba(254,243,199,0.85)',
      divider:    'linear-gradient(90deg,transparent,rgba(212,175,55,0.5),transparent)',
      body:       'rgba(253,248,235,0.78)',
      bodyStrong: '#fff',
      statsVal:   'rgba(254,243,199,0.9)',
      statsLbl:   'rgba(212,175,55,0.55)',
      cta:        'rgba(212,175,55,0.8)',
      ctaColor:   'rgba(254,243,199,0.95)',
      ctaHover:   'rgba(212,175,55,0.12)',
      ctaHoverShadow: '0 0 20px rgba(212,175,55,0.25)',
    },
    neon: {
      border:     'rgba(232,121,249,0.5)',
      shadow:     '0 0 60px rgba(232,121,249,0.18), 0 0 120px rgba(232,121,249,0.06)',
      eyebrow:    'rgba(232,121,249,0.7)',
      eyebrowSep: 'rgba(201,168,76,0.5)',
      title:      'rgba(240,171,252,0.95)',
      subtitle:   'rgba(240,171,252,0.8)',
      divider:    'linear-gradient(90deg,transparent,rgba(232,121,249,0.45),transparent)',
      body:       'rgba(253,248,255,0.78)',
      bodyStrong: '#fff',
      statsVal:   'rgba(240,171,252,0.9)',
      statsLbl:   'rgba(232,121,249,0.5)',
      cta:        'rgba(232,121,249,0.7)',
      ctaColor:   'rgba(240,171,252,0.95)',
      ctaHover:   'rgba(232,121,249,0.12)',
      ctaHoverShadow: '0 0 20px rgba(232,121,249,0.25)',
    },
    water: {
      border:     'rgba(34,211,238,0.45)',
      shadow:     '0 0 60px rgba(34,211,238,0.14), 0 0 120px rgba(34,211,238,0.06)',
      eyebrow:    'rgba(34,211,238,0.7)',
      eyebrowSep: 'rgba(201,168,76,0.5)',
      title:      'rgba(34,211,238,0.9)',
      subtitle:   'rgba(103,232,249,0.85)',
      divider:    'linear-gradient(90deg,transparent,rgba(34,211,238,0.4),transparent)',
      body:       'rgba(236,254,255,0.78)',
      bodyStrong: '#fff',
      statsVal:   'rgba(103,232,249,0.9)',
      statsLbl:   'rgba(34,211,238,0.5)',
      cta:        'rgba(34,211,238,0.7)',
      ctaColor:   'rgba(103,232,249,0.95)',
      ctaHover:   'rgba(34,211,238,0.1)',
      ctaHoverShadow: '0 0 20px rgba(34,211,238,0.2)',
    },
  };

  var p = palettes[POPUP_CONFIG.style] || palettes.crystal;
  var uid = 'pp-' + Math.random().toString(36).slice(2, 7);

  /* Inject styles */
  var style = document.createElement('style');
  style.textContent = [
    '#' + uid + '-overlay{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;padding:1.5rem;background:rgba(4,3,2,0.88);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);animation:pp-in 0.6s ease forwards;}',
    '#' + uid + '-overlay.pp-out{animation:pp-out 0.35s ease forwards;pointer-events:none;}',
    '@keyframes pp-in{from{opacity:0}to{opacity:1}}',
    '@keyframes pp-out{from{opacity:1}to{opacity:0}}',
    '#' + uid + '-card{position:relative;max-width:480px;width:100%;background:#070504;border:1px solid ' + p.border + ';box-shadow:' + p.shadow + ';border-radius:4px;padding:2.5rem 2rem 2rem;text-align:center;font-family:Georgia,serif;color:#e8d4a0;animation:pp-card-in 0.7s cubic-bezier(0.16,1,0.3,1) forwards;}',
    '@keyframes pp-card-in{from{opacity:0;transform:translateY(18px) scale(0.97)}to{opacity:1;transform:translateY(0) scale(1)}}',
    '#' + uid + '-card::after{content:"";position:absolute;inset:0;pointer-events:none;border-radius:4px;background:repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,0,0,0.035) 3px,rgba(0,0,0,0.035) 4px);}',
    '.' + uid + '-close{position:absolute;top:0.75rem;right:0.9rem;background:none;border:none;cursor:pointer;color:rgba(201,168,76,0.5);font-size:1.1rem;line-height:1;font-family:Georgia,serif;transition:color 0.2s;z-index:1;}',
    '.' + uid + '-close:hover{color:rgba(201,168,76,0.9);}',
    '.' + uid + '-eyebrow{font-size:0.58rem;letter-spacing:0.4em;text-transform:uppercase;color:' + p.eyebrow + ';margin-bottom:1.25rem;}',
    '.' + uid + '-eyebrow span{color:' + p.eyebrowSep + ';}',
    '.' + uid + '-title{font-size:clamp(1.6rem,5vw,2.2rem);font-weight:700;color:transparent;-webkit-text-stroke:1.2px ' + p.title + ';letter-spacing:0.06em;text-transform:uppercase;margin-bottom:0.3rem;line-height:1;}',
    '.' + uid + '-subtitle{font-size:0.75rem;letter-spacing:0.3em;text-transform:uppercase;color:' + p.subtitle + ';margin-bottom:1.5rem;}',
    '.' + uid + '-divider{width:48px;height:1px;background:' + p.divider + ';margin:0 auto 1.4rem;}',
    '.' + uid + '-body{font-size:0.88rem;line-height:1.65;color:' + p.body + ';margin-bottom:1.6rem;max-width:38ch;margin-left:auto;margin-right:auto;}',
    '.' + uid + '-body strong{color:' + p.bodyStrong + ';font-weight:normal;}',
    '.' + uid + '-stats{display:flex;justify-content:center;gap:2rem;margin-bottom:1.75rem;font-size:0.72rem;letter-spacing:0.12em;color:' + p.statsLbl + ';text-transform:uppercase;}',
    '.' + uid + '-stats span{display:flex;flex-direction:column;gap:0.15rem;align-items:center;}',
    '.' + uid + '-stats strong{color:' + p.statsVal + ';font-size:1rem;letter-spacing:0;font-family:Georgia,serif;}',
    '.' + uid + '-cta{display:inline-block;padding:0.8rem 2rem;background:transparent;border:1px solid ' + p.cta + ';color:' + p.ctaColor + ';text-decoration:none;border-radius:2px;font-family:Georgia,serif;font-size:0.9rem;letter-spacing:0.14em;text-transform:uppercase;transition:background 0.2s,box-shadow 0.2s;position:relative;z-index:1;}',
    '.' + uid + '-cta:hover{background:' + p.ctaHover + ';box-shadow:' + p.ctaHoverShadow + ';}',
    '.' + uid + '-secondary{display:block;margin-top:0.6rem;font-size:0.75rem;letter-spacing:0.12em;text-transform:uppercase;color:rgba(168,230,240,0.65);text-decoration:none;position:relative;z-index:1;transition:color 0.2s;}',
    '.' + uid + '-secondary:hover{color:rgba(168,230,240,0.95);}',
    '.' + uid + '-dismiss{display:block;margin-top:0.85rem;padding:0.65rem 1.8rem;font-size:0.72rem;letter-spacing:0.18em;text-transform:uppercase;color:rgba(200,180,140,0.65);cursor:pointer;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.12);border-radius:2px;font-family:Georgia,serif;transition:color 0.2s,border-color 0.2s,background 0.2s;position:relative;z-index:1;width:100%;}',
    '.' + uid + '-dismiss:hover{color:rgba(255,255,255,0.85);border-color:rgba(255,255,255,0.35);background:rgba(255,255,255,0.08);}',
    '.' + uid + '-nsp{margin-top:1.5rem;font-size:0.55rem;letter-spacing:0.25em;text-transform:uppercase;color:rgba(106,80,48,0.5);}',
  ].join('\n');
  document.head.appendChild(style);

  /* Build stats HTML */
  var statsHtml = '';
  if (POPUP_CONFIG.stats && POPUP_CONFIG.stats.length) {
    statsHtml = '<div class="' + uid + '-stats">' +
      POPUP_CONFIG.stats.map(function (s) {
        return '<span><strong>' + s.value + '</strong>' + s.label + '</span>';
      }).join('') +
      '</div>';
  }

  /* Build overlay HTML */
  var div = document.createElement('div');
  div.id = uid + '-overlay';
  div.setAttribute('role', 'dialog');
  div.setAttribute('aria-modal', 'true');
  div.setAttribute('aria-label', POPUP_CONFIG.title);
  var secondaryHtml = (POPUP_CONFIG.secondary_text && POPUP_CONFIG.secondary_href)
    ? '<a href="' + POPUP_CONFIG.secondary_href + '" class="' + uid + '-secondary">' + POPUP_CONFIG.secondary_text + '</a>'
    : '';

  div.innerHTML = '<div id="' + uid + '-card">' +
    '<button class="' + uid + '-close" id="' + uid + '-close-btn" aria-label="Close">✕</button>' +
    '<p class="' + uid + '-eyebrow">' + POPUP_CONFIG.eyebrow + '</p>' +
    '<h2 class="' + uid + '-title">' + POPUP_CONFIG.title + '</h2>' +
    '<p class="' + uid + '-subtitle">' + POPUP_CONFIG.subtitle + '</p>' +
    '<div class="' + uid + '-divider"></div>' +
    '<div class="' + uid + '-body">' + POPUP_CONFIG.body + '</div>' +
    statsHtml +
    '<a href="' + POPUP_CONFIG.cta_href + '" class="' + uid + '-cta">' + POPUP_CONFIG.cta_text + '</a>' +
    secondaryHtml +
    '<button class="' + uid + '-dismiss" id="' + uid + '-dismiss-btn">' + POPUP_CONFIG.dismiss_text + '</button>' +
    '<p class="' + uid + '-nsp">' + POPUP_CONFIG.nsp + '</p>' +
    '</div>';
  document.body.appendChild(div);

  /* Dismiss function */
  function dismiss() {
    var el = document.getElementById(uid + '-overlay');
    if (!el) return;
    el.classList.add('pp-out');
    setTimeout(function () { el.style.display = 'none'; }, 380);
    if (POPUP_CONFIG.dismiss === 'session') sessionStorage.setItem(storageKey, '1');
    if (POPUP_CONFIG.dismiss === 'permanent') localStorage.setItem(storageKey, '1');
  }

  document.getElementById(uid + '-close-btn').addEventListener('click', dismiss);
  document.getElementById(uid + '-dismiss-btn').addEventListener('click', dismiss);

  /* Close on backdrop click */
  div.addEventListener('click', function (e) {
    if (e.target === div) dismiss();
  });

  /* Close on Escape */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') dismiss();
  }, { once: true });

})();
