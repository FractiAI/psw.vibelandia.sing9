/**
 * POPUP ANNOUNCEMENT SYSTEM · NSPFRNP · HOLOGRAPHIC ENGINE v2
 *
 * Drop into any page:
 *   <script src="/popup-announcement.js"></script>      (root pages)
 *   <script src="../popup-announcement.js"></script>    (interfaces/ pages)
 *
 * To update: edit POPUP_CONFIG below.
 * To silence: set active: false.
 * dismiss: 'session' | 'permanent' | 'always'
 */

var _lang  = (navigator.languages && navigator.languages[0]) || navigator.language || 'en';
var _isES  = /^es\b/i.test(_lang);

var POPUP_CONFIG = {
  active:  true,
  id:      'hna-expedition-v1',
  dismiss: 'session',

  eyebrow:  _isES ? 'HH EXPEDICIONES · CUERPO NAVEGADOR · SELECCIÓN DE TRIPULACIÓN' : 'HH EXPEDITIONS · NAVIGATOR CORPS · CREW SELECTION',
  title:    _isES ? 'EXPEDICIONES DE\nHIDRÓGENO HOLOGRÁFICO' : 'HOLOGRAPHIC HYDROGEN\nEXPEDITIONS',
  subtitle: _isES
    ? 'La selección de tripulación está abierta.\nCohort Uno se despliega el 3 de marzo de 2026.'
    : 'Crew selection is now open.\nCohort One deploys March 3, 2026.',

  tiers: [
    { spots:'1–3', badge:'⭐', cls:'g',
      name: _isES ? 'Comandantes de Misión'   : 'Mission Commanders',
      desc: _isES ? 'Sesión pre-misión 1:1 + registro permanente de tripulación' : 'Pre-mission 1:1 briefing + permanent crew registry' },
    { spots:'4–6', badge:'✦', cls:'c',
      name: _isES ? 'Oficiales de Ciencia'    : 'Science Officers',
      desc: _isES ? 'Orientación grupal pre-misión + expediente de expedición'   : 'Group pre-mission orientation + expedition brief' },
    { spots:'7–9', badge:'◈', cls:'p',
      name: _isES ? 'Especialistas en Navegación' : 'Navigation Specialists',
      desc: _isES ? 'Sesión completa de expedición + paquete de campo'           : 'Full expedition session + field resource pack' },
  ],

  cta_text:       _isES ? '⬡ Presentar Solicitud' : '⬡ Apply for Selection',
  cta_href:       'mailto:info@fractiai.com'
    + '?subject=' + encodeURIComponent('HH Expeditions \u2014 Crew Application \u00b7 Cohort One')
    + '&body='    + encodeURIComponent(
        'To: HH Expeditions Selection Board\n\n'
      + 'I am submitting my application for Cohort One crew selection.\n\n'
      + 'Expedition: Holographic Hydrogen Expeditions\n'
      + 'Deployment: March 3, 2026 \u00b7 Tuesdays \u00b7 15:33 PST \u00b7 T+60 min\n\n'
      + 'Requested position (circle one): Mission Commander / Science Officer / Navigation Specialist\n\n'
      + 'Name:\nTimezone:\nWhy I\u2019m applying:\n\n'
      + 'NSPFRNP \u2192 \u221e\u2079'),

  secondary_text: _isES ? '▶ Informe de Misión Completo' : '▶ Full Mission Briefing',
  secondary_href: '/interfaces/holographic-navigator-academy.html',

  dismiss_text:   _isES ? '✕  En espera' : '✕  Stand down for now',
  nsp:            'COHORT ONE \u00b7 9 CREW POSITIONS \u00b7 NSPFRNP \u2192 \u221e\u2079',
};

/* ═══════════════════════════════════════════════════════════════════
   HOLOGRAPHIC ENGINE  — no edits needed below for normal use
═══════════════════════════════════════════════════════════════════ */
(function () {
  if (!POPUP_CONFIG.active) return;

  var KEY = 'popup-dismissed-' + POPUP_CONFIG.id;
  if (POPUP_CONFIG.dismiss === 'session'   && sessionStorage.getItem(KEY)) return;
  if (POPUP_CONFIG.dismiss === 'permanent' && localStorage.getItem(KEY))   return;

  var u = 'hna' + Math.random().toString(36).slice(2, 7);

  /* ── CSS ─────────────────────────────────────────────────────── */
  var css = [
    /* overlay */
    '#'+u+'-ov{position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;padding:1rem;background:rgba(0,0,10,.90);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);animation:'+u+'fi .5s ease both;}',
    '#'+u+'-ov.out{animation:'+u+'fo .38s ease both;pointer-events:none;}',
    '@keyframes '+u+'fi{from{opacity:0}to{opacity:1}}',
    '@keyframes '+u+'fo{from{opacity:1}to{opacity:0}}',

    /* star field overlay */
    '#'+u+'-ov::before{content:"";position:absolute;inset:0;pointer-events:none;'
      +'background-image:'
      +'radial-gradient(1px 1px at 12% 18%,rgba(0,212,255,.55) 0%,transparent 100%),'
      +'radial-gradient(1.5px 1.5px at 88% 8%,rgba(212,175,55,.5) 0%,transparent 100%),'
      +'radial-gradient(1px 1px at 66% 72%,rgba(123,47,255,.5) 0%,transparent 100%),'
      +'radial-gradient(1px 1px at 35% 90%,rgba(0,255,136,.4) 0%,transparent 100%),'
      +'radial-gradient(1.5px 1.5px at 92% 50%,rgba(0,212,255,.4) 0%,transparent 100%),'
      +'radial-gradient(1px 1px at 8% 55%,rgba(212,175,55,.35) 0%,transparent 100%),'
      +'radial-gradient(1px 1px at 55% 28%,rgba(255,255,255,.2) 0%,transparent 100%),'
      +'radial-gradient(1px 1px at 78% 85%,rgba(0,255,136,.3) 0%,transparent 100%);}',

    /* wrap — the spinning border shell */
    '#'+u+'-wr{position:relative;width:min(480px,calc(100vw - 2rem));border-radius:18px;padding:1.5px;overflow:hidden;animation:'+u+'su .65s cubic-bezier(.22,1,.36,1) .1s both;}',
    '@keyframes '+u+'su{from{opacity:0;transform:translateY(44px) scale(.95)}to{opacity:1;transform:translateY(0) scale(1)}}',

    /* the conic spinner */
    '#'+u+'-wr::before{content:"";position:absolute;inset:-100%;'
      +'background:conic-gradient(from 0deg,'
      +'rgba(0,212,255,.95) 0deg,'
      +'rgba(123,47,255,.85) 72deg,'
      +'rgba(212,175,55,.95) 144deg,'
      +'rgba(0,255,136,.75) 216deg,'
      +'rgba(0,212,255,.6)  288deg,'
      +'rgba(0,212,255,.95) 360deg);'
      +'animation:'+u+'sp 3.5s linear infinite;}',
    '@keyframes '+u+'sp{to{transform:rotate(360deg)}}',

    /* card body */
    '#'+u+'-card{position:relative;background:linear-gradient(158deg,#080820 0%,#04040e 55%,#080820 100%);border-radius:16.5px;padding:1.85rem 1.65rem 1.4rem;overflow:hidden;z-index:1;font-family:"Segoe UI",system-ui,sans-serif;color:#e2e8f0;}',

    /* inner ambient glow */
    '#'+u+'-card::after{content:"";position:absolute;inset:0;border-radius:16.5px;pointer-events:none;'
      +'background:radial-gradient(ellipse 70% 35% at 50% 0%,rgba(0,212,255,.08) 0%,transparent 70%),'
      +'radial-gradient(ellipse 45% 45% at 100% 100%,rgba(123,47,255,.06) 0%,transparent 70%),'
      +'radial-gradient(ellipse 40% 40% at 0% 100%,rgba(212,175,55,.04) 0%,transparent 70%);}',

    /* close btn */
    '#'+u+'-x{position:absolute;top:.85rem;right:.85rem;z-index:10;width:28px;height:28px;border-radius:50%;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);color:rgba(255,255,255,.38);font-size:.72rem;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .18s;line-height:1;padding:0;}',
    '#'+u+'-x:hover{background:rgba(255,60,60,.2);color:#ffaaaa;border-color:rgba(255,60,60,.4);}',

    /* eyebrow */
    '.'+u+'-ey{font-size:.5rem;font-weight:700;letter-spacing:.38em;text-transform:uppercase;color:rgba(0,212,255,.55);text-align:center;margin-bottom:1.1rem;animation:'+u+'fu .5s ease .35s both;}',

    /* atom */
    '.'+u+'-atom{width:76px;height:76px;margin:0 auto 1.1rem;position:relative;display:flex;align-items:center;justify-content:center;animation:'+u+'fu .6s ease .5s both;}',
    '.'+u+'-atom-glow{position:absolute;inset:-12px;border-radius:50%;background:radial-gradient(circle,rgba(0,212,255,.15) 0%,transparent 70%);animation:'+u+'ag 3s ease-in-out infinite;}',
    '@keyframes '+u+'ag{0%,100%{transform:scale(1);opacity:.7}50%{transform:scale(1.3);opacity:1}}',
    '.'+u+'-ring{position:absolute;border-radius:50%;border:1px solid;}',
    '.'+u+'-r1{inset:6px;border-color:rgba(0,212,255,.5);animation:'+u+'rt 6s linear infinite;}',
    '.'+u+'-r2{inset:-6px;border-color:rgba(212,175,55,.32);animation:'+u+'rt 11s linear infinite reverse;}',
    '.'+u+'-r3{inset:16px;border-color:rgba(123,47,255,.45);animation:'+u+'rt 8.5s linear infinite;}',
    '@keyframes '+u+'rt{to{transform:rotate(360deg)}}',
    '.'+u+'-core{font-size:1.2rem;font-weight:900;position:relative;z-index:1;background:linear-gradient(135deg,#00d4ff,#fde68a 55%,#b46ef7);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;letter-spacing:-.02em;}',

    /* headline */
    '.'+u+'-h1{font-size:clamp(1.1rem,4.5vw,1.5rem);font-weight:900;line-height:1.18;letter-spacing:-.015em;text-align:center;margin-bottom:.5rem;padding:0 1.5rem;'
      +'background:linear-gradient(130deg,#fff 0%,#00d4ff 35%,#d4af37 65%,#fff 100%);'
      +'background-size:200% 200%;'
      +'-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;'
      +'animation:'+u+'fu .6s ease .65s both,'+u+'sh 5s ease-in-out 1.8s infinite;}',
    '@keyframes '+u+'sh{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}',

    /* subtitle */
    '.'+u+'-sub{font-size:.77rem;color:rgba(180,215,255,.55);text-align:center;line-height:1.55;margin-bottom:.95rem;white-space:pre-line;animation:'+u+'fu .5s ease .8s both;}',

    /* pills */
    '.'+u+'-pills{display:flex;flex-wrap:wrap;gap:.38rem;justify-content:center;margin-bottom:.95rem;animation:'+u+'fu .5s ease .95s both;}',
    '.'+u+'-pill{font-size:.62rem;font-weight:700;letter-spacing:.06em;padding:.2rem .65rem;border-radius:20px;white-space:nowrap;}',
    '.'+u+'-pg{background:rgba(212,175,55,.12);border:1px solid rgba(212,175,55,.45);color:#d4af37;}',
    '.'+u+'-pc{background:rgba(0,212,255,.1);border:1px solid rgba(0,212,255,.4);color:#00d4ff;}',
    '.'+u+'-pp{background:rgba(123,47,255,.12);border:1px solid rgba(123,47,255,.42);color:#b46ef7;}',

    /* 9 spot dots */
    '.'+u+'-spots{display:flex;align-items:center;justify-content:center;gap:.32rem;margin-bottom:.95rem;}',
    '.'+u+'-dot{width:21px;height:21px;border-radius:50%;font-size:.5rem;font-weight:900;display:flex;align-items:center;justify-content:center;opacity:0;transform:scale(.2);transition:opacity .42s ease,transform .42s cubic-bezier(.34,1.56,.64,1),box-shadow .42s ease;}',
    '.'+u+'-dot.lit{opacity:1;transform:scale(1);}',
    '.'+u+'-dg{background:rgba(212,175,55,.16);border:1.5px solid rgba(212,175,55,.65);color:#d4af37;}',
    '.'+u+'-dg.lit{box-shadow:0 0 12px rgba(212,175,55,.45);}',
    '.'+u+'-dc{background:rgba(0,212,255,.12);border:1.5px solid rgba(0,212,255,.6);color:#00d4ff;}',
    '.'+u+'-dc.lit{box-shadow:0 0 12px rgba(0,212,255,.45);}',
    '.'+u+'-dp{background:rgba(123,47,255,.14);border:1.5px solid rgba(123,47,255,.6);color:#b46ef7;}',
    '.'+u+'-dp.lit{box-shadow:0 0 12px rgba(123,47,255,.45);}',

    /* tiers */
    '.'+u+'-tiers{display:flex;flex-direction:column;gap:4px;margin-bottom:1rem;}',
    '.'+u+'-tier{display:flex;align-items:flex-start;gap:.45rem;padding:.3rem .58rem;border-radius:6px;font-size:.67rem;border-left:2px solid;opacity:0;transform:translateX(-10px);transition:opacity .42s ease,transform .42s ease;}',
    '.'+u+'-tier.on{opacity:1;transform:translateX(0);}',
    '.'+u+'-tg{background:rgba(212,175,55,.07);border-color:rgba(212,175,55,.5);}',
    '.'+u+'-tc{background:rgba(0,212,255,.06);border-color:rgba(0,212,255,.42);}',
    '.'+u+'-tp{background:rgba(123,47,255,.07);border-color:rgba(123,47,255,.42);}',
    '.'+u+'-tbadge{font-size:.58rem;font-weight:900;letter-spacing:.04em;flex-shrink:0;margin-top:.06rem;}',
    '.'+u+'-tg .'+u+'-tbadge{color:#d4af37;}',
    '.'+u+'-tc .'+u+'-tbadge{color:#00d4ff;}',
    '.'+u+'-tp .'+u+'-tbadge{color:#b46ef7;}',
    '.'+u+'-tname{color:rgba(255,255,255,.88);font-weight:700;}',
    '.'+u+'-tdesc{color:rgba(255,255,255,.38);margin-left:.2rem;}',

    /* divider */
    '.'+u+'-div{height:1px;margin:.7rem 0;background:linear-gradient(90deg,transparent,rgba(0,212,255,.35),rgba(212,175,55,.35),transparent);animation:'+u+'fu .4s ease 2s both;}',

    /* cta row */
    '.'+u+'-ctas{display:flex;gap:.5rem;flex-wrap:wrap;animation:'+u+'fu .6s ease 2.1s both;}',

    /* primary cta — pulsing glow + sweep shimmer */
    '.'+u+'-btip{flex:1.5;min-width:150px;padding:.72rem 1rem;'
      +'background:linear-gradient(135deg,rgba(0,212,255,.22),rgba(123,47,255,.22));'
      +'border:1.5px solid rgba(0,212,255,.65);border-radius:10px;cursor:pointer;'
      +'text-decoration:none;color:#d8f4ff;font-size:.8rem;font-weight:800;'
      +'letter-spacing:.05em;text-align:center;display:block;'
      +'transition:all .22s;position:relative;overflow:hidden;'
      +'animation:'+u+'gp 2.8s ease-in-out 3s infinite;}',
    '@keyframes '+u+'gp{0%,100%{box-shadow:0 0 16px rgba(0,212,255,.25)}50%{box-shadow:0 0 36px rgba(0,212,255,.6),0 0 70px rgba(0,212,255,.18)}}',
    '.'+u+'-btip::before{content:"";position:absolute;top:-50%;left:-80%;width:50%;height:200%;'
      +'background:linear-gradient(90deg,transparent,rgba(255,255,255,.14),transparent);'
      +'transform:skewX(-18deg);transition:left .55s ease;}',
    '.'+u+'-btip:hover{background:linear-gradient(135deg,rgba(0,212,255,.38),rgba(123,47,255,.38));'
      +'box-shadow:0 0 44px rgba(0,212,255,.5)!important;transform:translateY(-2px);}',
    '.'+u+'-btip:hover::before{left:130%;}',

    /* secondary cta */
    '.'+u+'-bdet{flex:1;min-width:108px;padding:.72rem .7rem;background:rgba(255,255,255,.04);'
      +'border:1px solid rgba(255,255,255,.14);border-radius:10px;cursor:pointer;'
      +'text-decoration:none;color:rgba(255,255,255,.55);font-size:.75rem;font-weight:600;'
      +'text-align:center;display:block;transition:all .2s;}',
    '.'+u+'-bdet:hover{background:rgba(255,255,255,.09);color:#fff;border-color:rgba(255,255,255,.35);}',

    /* dismiss */
    '.'+u+'-dis{display:block;width:100%;margin-top:.6rem;background:none;border:none;'
      +'cursor:pointer;color:rgba(255,255,255,.2);font-size:.62rem;letter-spacing:.16em;'
      +'text-transform:uppercase;padding:.28rem;transition:color .2s;font-family:inherit;'
      +'animation:'+u+'fu .4s ease 2.4s both;}',
    '.'+u+'-dis:hover{color:rgba(255,255,255,.5);}',

    /* footer */
    '.'+u+'-foot{margin-top:.55rem;font-size:.5rem;letter-spacing:.16em;text-transform:uppercase;'
      +'text-align:center;color:rgba(212,175,55,.28);animation:'+u+'fu .4s ease 2.55s both;}',

    /* shared fade-up keyframe */
    '@keyframes '+u+'fu{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}',
  ].join('\n');

  var sEl = document.createElement('style');
  sEl.textContent = css;
  document.head.appendChild(sEl);

  /* ── BUILD DOM ───────────────────────────────────────────────── */
  var tiers = POPUP_CONFIG.tiers || [];
  var tMap  = { g:'tg', c:'tc', p:'tp' };

  var tiersHtml = tiers.map(function(t) {
    var tc = tMap[t.cls] || 'tg';
    return '<div class="'+u+'-tier '+u+'-'+tc+'">'
      +'<span class="'+u+'-tbadge">'+t.badge+' '+t.spots+'</span>'
      +'<span>'
        +'<span class="'+u+'-tname">'+t.name+'</span>'
        +'<span class="'+u+'-tdesc"> \u2014 '+t.desc+'</span>'
      +'</span></div>';
  }).join('');

  var dotDef = ['dg','dg','dg','dc','dc','dc','dp','dp','dp'];
  var dotsHtml = dotDef.map(function(cls, i) {
    return '<span class="'+u+'-dot '+u+'-'+cls+'" data-i="'+i+'">'+(i+1)+'</span>';
  }).join('');

  var title = POPUP_CONFIG.title.replace('\n','<br>');

  var ov = document.createElement('div');
  ov.id = u+'-ov';
  ov.setAttribute('role','dialog');
  ov.setAttribute('aria-modal','true');
  ov.innerHTML =
    '<div id="'+u+'-wr">'
    +'<div id="'+u+'-card">'
      +'<button id="'+u+'-x" aria-label="Close">\u2715</button>'
      +'<div class="'+u+'-ey">'+POPUP_CONFIG.eyebrow+'</div>'
      +'<div class="'+u+'-atom">'
        +'<div class="'+u+'-atom-glow"></div>'
        +'<div class="'+u+'-ring '+u+'-r1"></div>'
        +'<div class="'+u+'-ring '+u+'-r2"></div>'
        +'<div class="'+u+'-ring '+u+'-r3"></div>'
        +'<span class="'+u+'-core">H\u00b2</span>'
      +'</div>'
      +'<h2 class="'+u+'-h1">'+title+'</h2>'
      +'<p class="'+u+'-sub">'+POPUP_CONFIG.subtitle.replace('\n','<br>')+'</p>'
      +'<div class="'+u+'-pills">'
        +'<span class="'+u+'-pill '+u+'-pg">MISSION DATE \u00b7 MAR 3 \u00b7 2026</span>'
        +'<span class="'+u+'-pill '+u+'-pc">REPORT \u00b7 15:33 PST</span>'
        +'<span class="'+u+'-pill '+u+'-pp">DURATION \u00b7 T+60 MIN</span>'
      +'</div>'
      +'<div class="'+u+'-spots">'+dotsHtml+'</div>'
      +'<div class="'+u+'-tiers">'+tiersHtml+'</div>'
      +'<div class="'+u+'-div"></div>'
      +'<div class="'+u+'-ctas">'
        +'<a href="'+POPUP_CONFIG.cta_href+'" class="'+u+'-btip">'+POPUP_CONFIG.cta_text+'</a>'
        +'<a href="'+POPUP_CONFIG.secondary_href+'" class="'+u+'-bdet" target="_blank">'+POPUP_CONFIG.secondary_text+'</a>'
      +'</div>'
      +'<button class="'+u+'-dis" id="'+u+'-dis">'+POPUP_CONFIG.dismiss_text+'</button>'
      +'<p class="'+u+'-foot">'+POPUP_CONFIG.nsp+'</p>'
    +'</div></div>';

  document.body.appendChild(ov);

  /* ── STAGGER: dots light up, then tiers slide in ─────────────── */
  var dots  = ov.querySelectorAll('.'+u+'-dot');
  var tEls  = ov.querySelectorAll('.'+u+'-tier');

  dots.forEach(function(d, i) {
    setTimeout(function() { d.classList.add('lit'); }, 1350 + i * 110);
  });
  tEls.forEach(function(t, i) {
    setTimeout(function() { t.classList.add('on'); }, 2550 + i * 140);
  });

  /* ── DISMISS ─────────────────────────────────────────────────── */
  function dismiss() {
    var el = document.getElementById(u+'-ov');
    if (!el) return;
    el.classList.add('out');
    setTimeout(function() { if (el.parentNode) el.parentNode.removeChild(el); }, 400);
    if (POPUP_CONFIG.dismiss === 'session')   sessionStorage.setItem(KEY,'1');
    if (POPUP_CONFIG.dismiss === 'permanent') localStorage.setItem(KEY,'1');
  }

  document.getElementById(u+'-x').addEventListener('click', dismiss);
  document.getElementById(u+'-dis').addEventListener('click', dismiss);
  ov.addEventListener('click', function(e) { if (e.target === ov) dismiss(); });
  document.addEventListener('keydown', function(e) { if (e.key === 'Escape') dismiss(); }, { once:true });

})();
