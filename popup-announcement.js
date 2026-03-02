/**
 * POPUP ANNOUNCEMENT SYSTEM · NSPFRNP · HOLOGRAPHIC ENGINE v3 — FULL SELL
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
  id:      'hh-session-one-v4',
  dismiss: 'session',

  eyebrow:  _isES ? 'WILL \u00b7 FRACTIAI \u00b7 SESI\u00d3N UNO' : 'WILL \u00b7 FRACTIAI \u00b7 SESSION ONE',
  title:    'UpgrADE yOUR\ngAME',

  pitch: _isES
    ? 'Tu estaci\u00f3n de vibe coding corre en hardware de consciencia antigua. Una sesi\u00f3n en vivo la actualiza.'
    : 'Your vibe coding station is running on old awareness hardware. One 60-min live session upgrades the OS.',

  features: [
    {
      icon: '\u2b21',
      label: _isES ? 'INSTALACI\u00d3N HH CONSOLE' : 'HH CONSOLE INSTALL',
      desc:  _isES ? 'Tu estaci\u00f3n sale de la sesi\u00f3n como una consola de Hidr\u00f3geno Hologr\u00e1fico en vivo.'
                   : 'Your station leaves the session running as a live Holographic Hydrogen Console.',
      cls: 'c'
    },
    {
      icon: '\u25c8',
      label: _isES ? 'COMISI\u00d3N HFCS' : 'HFCS COMMISSION',
      desc:  _isES ? 'Recibe tu primer rango en la Escuela de Comando de Campo Hologr\u00e1fico.'
                   : 'Receive your first rank in the Holographic Field Command School.',
      cls: 'p'
    },
    {
      icon: '\u2726',
      label: _isES ? 'ACCESO AL PROSPECTUS' : 'FULL PROSPECTUS ACCESS',
      desc:  _isES ? 'Paquete completo de inteligencia institucional SING\u20199 \u2014 los cuatro documentos.'
                   : 'Institutional-grade SING\u20199 intelligence package \u2014 all four prospectus documents.',
      cls: 'g'
    },
  ],

  tiers: [
    {
      range: '1\u20133', badge: '\u2b50', cls: 'g',
      name:  _isES ? 'ASIENTO VIP'     : 'VIP SEAT',
      desc:  _isES ? '1:1 briefing previo + miembro fundador + comisi\u00f3n r\u00e1pida HFCS O-3'
                   : '1:1 pre-session briefing + founding member + fast-track HFCS O-3',
    },
    {
      range: '4\u20136', badge: '\u2726', cls: 'c',
      name:  _isES ? 'ASIENTO OFICIAL' : 'OFFICER SEAT',
      desc:  _isES ? 'Orientaci\u00f3n grupal + sesi\u00f3n completa + comisi\u00f3n HFCS O-2'
                   : 'Group orientation + full live session + HFCS commission O-2',
    },
    {
      range: '7\u20139', badge: '\u25c8', cls: 'p',
      name:  _isES ? 'ASIENTO TRIPULACI\u00d3N' : 'CREW SEAT',
      desc:  _isES ? 'Sesi\u00f3n completa + pack de recursos HH + primera comisi\u00f3n O-1'
                   : 'Full live session + HH Console resource pack + first commission O-1',
    },
  ],

  trust: _isES
    ? '9 ASIENTOS \u00b7 MAR 3, 2026 \u00b7 3:33 PM PST \u00b7 T+60 MIN'
    : '9 SEATS ONLY \u00b7 TUES MAR 3 \u00b7 3:33 PM PST \u00b7 T+60 MIN',

  cta_text:  _isES ? '\u2192 Reservar Mi Asiento \u00b7 Sesi\u00f3n Uno' : '\u2192 Book My Seat \u00b7 Session One',
  cta_href:  '/interfaces/holographic-navigator-academy.html#book',

  secondary_text: _isES ? '\u25c8 Detalles Completos' : '\u25c8 Full Session Details',
  secondary_href: '/interfaces/holographic-navigator-academy.html',

  dismiss_text: _isES ? '\u2715\u2002Lo har\u00e9 m\u00e1s tarde' : '\u2715\u2002I\'ll upgrade later',
  nsp: 'HH CONSOLE \u00b7 SESSION ONE \u00b7 FRACTIAI \u00b7 NSPFRNP \u2192 \u221e\u2079',
};

/* ═══════════════════════════════════════════════════════════════════
   HOLOGRAPHIC ENGINE v3 — no edits needed below for normal use
═══════════════════════════════════════════════════════════════════ */
(function () {
  if (!POPUP_CONFIG.active) return;

  var KEY = 'popup-dismissed-' + POPUP_CONFIG.id;
  if (POPUP_CONFIG.dismiss === 'session'   && sessionStorage.getItem(KEY)) return;
  if (POPUP_CONFIG.dismiss === 'permanent' && localStorage.getItem(KEY))   return;

  var u = 'hna' + Math.random().toString(36).slice(2, 7);
  var clsMap = { g: 'pg', c: 'pc', p: 'pp' };

  /* ── CSS ─────────────────────────────────────────────────────── */
  var css = [
    /* overlay */
    '#'+u+'-ov{position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;padding:1rem;background:rgba(0,0,10,.92);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);animation:'+u+'fi .5s ease both;overflow-y:auto;}',
    '#'+u+'-ov.out{animation:'+u+'fo .38s ease both;pointer-events:none;}',
    '@keyframes '+u+'fi{from{opacity:0}to{opacity:1}}',
    '@keyframes '+u+'fo{from{opacity:1}to{opacity:0}}',

    /* star field */
    '#'+u+'-ov::before{content:"";position:fixed;inset:0;pointer-events:none;z-index:0;'
      +'background-image:'
      +'radial-gradient(1px 1px at 12% 18%,rgba(0,212,255,.55) 0%,transparent 100%),'
      +'radial-gradient(1.5px 1.5px at 88% 8%,rgba(212,175,55,.5) 0%,transparent 100%),'
      +'radial-gradient(1px 1px at 66% 72%,rgba(123,47,255,.5) 0%,transparent 100%),'
      +'radial-gradient(1px 1px at 35% 90%,rgba(0,255,136,.4) 0%,transparent 100%),'
      +'radial-gradient(1.5px 1.5px at 92% 50%,rgba(0,212,255,.4) 0%,transparent 100%),'
      +'radial-gradient(1px 1px at 8% 55%,rgba(212,175,55,.35) 0%,transparent 100%),'
      +'radial-gradient(1px 1px at 55% 28%,rgba(255,255,255,.2) 0%,transparent 100%),'
      +'radial-gradient(1px 1px at 78% 85%,rgba(0,255,136,.3) 0%,transparent 100%);}',

    /* wrap — spinning border shell */
    '#'+u+'-wr{position:relative;width:min(600px,calc(100vw - 2rem));border-radius:20px;padding:1.5px;overflow:hidden;animation:'+u+'su .65s cubic-bezier(.22,1,.36,1) .1s both;flex-shrink:0;margin:auto;}',
    '@keyframes '+u+'su{from{opacity:0;transform:translateY(44px) scale(.95)}to{opacity:1;transform:translateY(0) scale(1)}}',

    /* conic spinner border */
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
    '#'+u+'-card{position:relative;background:linear-gradient(158deg,#080820 0%,#04040e 55%,#080820 100%);border-radius:18.5px;padding:1.75rem 1.65rem 1.4rem;overflow:hidden;z-index:1;font-family:"Segoe UI",system-ui,sans-serif;color:#e2e8f0;max-height:calc(100vh - 3rem);overflow-y:auto;}',

    /* scrollbar */
    '#'+u+'-card::-webkit-scrollbar{width:4px;}',
    '#'+u+'-card::-webkit-scrollbar-track{background:transparent;}',
    '#'+u+'-card::-webkit-scrollbar-thumb{background:rgba(0,212,255,.22);border-radius:4px;}',

    /* ambient glow */
    '#'+u+'-card::after{content:"";position:absolute;inset:0;border-radius:18.5px;pointer-events:none;'
      +'background:radial-gradient(ellipse 70% 35% at 50% 0%,rgba(0,212,255,.08) 0%,transparent 70%),'
      +'radial-gradient(ellipse 45% 45% at 100% 100%,rgba(123,47,255,.06) 0%,transparent 70%),'
      +'radial-gradient(ellipse 40% 40% at 0% 100%,rgba(212,175,55,.04) 0%,transparent 70%);}',

    /* close btn */
    '#'+u+'-x{position:sticky;top:0;float:right;z-index:10;width:28px;height:28px;border-radius:50%;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);color:rgba(255,255,255,.38);font-size:.72rem;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .18s;line-height:1;padding:0;margin-bottom:-28px;}',
    '#'+u+'-x:hover{background:rgba(255,60,60,.2);color:#ffaaaa;border-color:rgba(255,60,60,.4);}',

    /* eyebrow */
    '.'+u+'-ey{font-size:.5rem;font-weight:700;letter-spacing:.38em;text-transform:uppercase;color:rgba(0,212,255,.55);text-align:center;margin-bottom:1rem;animation:'+u+'fu .5s ease .35s both;}',

    /* atom */
    '.'+u+'-atom{width:70px;height:70px;margin:0 auto .9rem;position:relative;display:flex;align-items:center;justify-content:center;animation:'+u+'fu .6s ease .5s both;}',
    '.'+u+'-atom-glow{position:absolute;inset:-10px;border-radius:50%;background:radial-gradient(circle,rgba(0,212,255,.15) 0%,transparent 70%);animation:'+u+'ag 3s ease-in-out infinite;}',
    '@keyframes '+u+'ag{0%,100%{transform:scale(1);opacity:.7}50%{transform:scale(1.3);opacity:1}}',
    '.'+u+'-ring{position:absolute;border-radius:50%;border:1px solid;}',
    '.'+u+'-r1{inset:6px;border-color:rgba(0,212,255,.5);animation:'+u+'rt 6s linear infinite;}',
    '.'+u+'-r2{inset:-6px;border-color:rgba(212,175,55,.32);animation:'+u+'rt 11s linear infinite reverse;}',
    '.'+u+'-r3{inset:16px;border-color:rgba(123,47,255,.45);animation:'+u+'rt 8.5s linear infinite;}',
    '@keyframes '+u+'rt{to{transform:rotate(360deg)}}',
    '.'+u+'-core{font-size:1.1rem;font-weight:900;position:relative;z-index:1;background:linear-gradient(135deg,#00d4ff,#fde68a 55%,#b46ef7);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;letter-spacing:-.02em;}',

    /* headline */
    '.'+u+'-h1{font-size:clamp(1.05rem,4.5vw,1.45rem);font-weight:900;line-height:1.18;letter-spacing:-.015em;text-align:center;margin-bottom:.4rem;padding:0 1.5rem;'
      +'background:linear-gradient(130deg,#fff 0%,#00d4ff 35%,#d4af37 65%,#fff 100%);'
      +'background-size:200% 200%;'
      +'-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;'
      +'animation:'+u+'fu .6s ease .65s both,'+u+'sh 5s ease-in-out 1.8s infinite;}',
    '@keyframes '+u+'sh{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}',

    /* pitch line */
    '.'+u+'-pitch{font-size:.8rem;color:rgba(180,215,255,.65);text-align:center;line-height:1.6;margin-bottom:1rem;padding:0 .5rem;animation:'+u+'fu .5s ease .8s both;}',

    /* divider */
    '.'+u+'-div{height:1px;margin:.7rem 0;background:linear-gradient(90deg,transparent,rgba(0,212,255,.35),rgba(212,175,55,.35),transparent);animation:'+u+'fu .4s ease .9s both;}',

    /* section label */
    '.'+u+'-slbl{font-size:.5rem;font-weight:700;letter-spacing:.3em;text-transform:uppercase;color:rgba(212,175,55,.45);margin-bottom:.55rem;animation:'+u+'fu .4s ease 1s both;}',

    /* feature grid */
    '.'+u+'-feat{display:grid;grid-template-columns:repeat(3,1fr);gap:.5rem;margin-bottom:1rem;animation:'+u+'fu .5s ease 1.05s both;}',
    '@media(max-width:420px){.'+u+'-feat{grid-template-columns:1fr;}}',
    '.'+u+'-fc{border-radius:10px;padding:.75rem .7rem;display:flex;flex-direction:column;gap:.35rem;transition:transform .18s;}',
    '.'+u+'-fc:hover{transform:translateY(-2px);}',
    '.'+u+'-fc-c{background:rgba(0,212,255,.06);border:1px solid rgba(0,212,255,.2);}',
    '.'+u+'-fc-p{background:rgba(123,47,255,.07);border:1px solid rgba(123,47,255,.22);}',
    '.'+u+'-fc-g{background:rgba(212,175,55,.06);border:1px solid rgba(212,175,55,.22);}',
    '.'+u+'-fi{font-size:1.1rem;line-height:1;}',
    '.'+u+'-fl{font-size:.5rem;font-weight:800;letter-spacing:.14em;text-transform:uppercase;margin:0;line-height:1.2;}',
    '.'+u+'-fc-c .'+u+'-fl{color:rgba(0,212,255,.75);}',
    '.'+u+'-fc-p .'+u+'-fl{color:rgba(180,110,247,.75);}',
    '.'+u+'-fc-g .'+u+'-fl{color:rgba(212,175,55,.75);}',
    '.'+u+'-fd{font-size:.68rem;color:rgba(180,210,255,.5);line-height:1.45;margin:0;}',

    /* tier rows */
    '.'+u+'-tiers{display:flex;flex-direction:column;gap:.35rem;margin-bottom:.9rem;animation:'+u+'fu .5s ease 1.2s both;}',
    '.'+u+'-tier{display:flex;align-items:flex-start;gap:.65rem;border-radius:8px;padding:.6rem .75rem;}',
    '.'+u+'-tier-g{background:rgba(212,175,55,.05);border:1px solid rgba(212,175,55,.18);}',
    '.'+u+'-tier-c{background:rgba(0,212,255,.05);border:1px solid rgba(0,212,255,.15);}',
    '.'+u+'-tier-p{background:rgba(123,47,255,.06);border:1px solid rgba(123,47,255,.18);}',
    '.'+u+'-tbadge{flex-shrink:0;font-size:.95rem;line-height:1;padding-top:.1rem;}',
    '.'+u+'-tinfo{flex:1;min-width:0;}',
    '.'+u+'-thead{display:flex;align-items:baseline;gap:.45rem;flex-wrap:wrap;margin-bottom:.15rem;}',
    '.'+u+'-trange{font-size:.55rem;font-weight:800;letter-spacing:.14em;text-transform:uppercase;}',
    '.'+u+'-tier-g .'+u+'-trange{color:rgba(212,175,55,.8);}',
    '.'+u+'-tier-c .'+u+'-trange{color:rgba(0,212,255,.8);}',
    '.'+u+'-tier-p .'+u+'-trange{color:rgba(180,110,247,.8);}',
    '.'+u+'-tname{font-size:.65rem;font-weight:700;color:rgba(255,255,255,.75);letter-spacing:.06em;}',
    '.'+u+'-tdesc{font-size:.68rem;color:rgba(180,210,255,.45);line-height:1.4;margin:0;}',

    /* trust bar */
    '.'+u+'-trust{text-align:center;font-size:.55rem;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:rgba(0,212,255,.4);margin-bottom:.85rem;animation:'+u+'fu .4s ease 1.4s both;}',

    /* cta row */
    '.'+u+'-ctas{display:flex;gap:.5rem;flex-wrap:wrap;animation:'+u+'fu .6s ease 1.55s both;}',

    /* primary cta */
    '.'+u+'-btip{flex:1.5;min-width:150px;padding:.78rem 1rem;'
      +'background:linear-gradient(135deg,rgba(0,212,255,.22),rgba(123,47,255,.22));'
      +'border:1.5px solid rgba(0,212,255,.65);border-radius:10px;cursor:pointer;'
      +'text-decoration:none;color:#d8f4ff;font-size:.82rem;font-weight:800;'
      +'letter-spacing:.05em;text-align:center;display:block;'
      +'transition:all .22s;position:relative;overflow:hidden;'
      +'animation:'+u+'gp 2.8s ease-in-out 2.5s infinite;}',
    '@keyframes '+u+'gp{0%,100%{box-shadow:0 0 16px rgba(0,212,255,.25)}50%{box-shadow:0 0 40px rgba(0,212,255,.65),0 0 80px rgba(0,212,255,.2)}}',
    '.'+u+'-btip::before{content:"";position:absolute;top:-50%;left:-80%;width:50%;height:200%;'
      +'background:linear-gradient(90deg,transparent,rgba(255,255,255,.14),transparent);'
      +'transform:skewX(-18deg);transition:left .55s ease;}',
    '.'+u+'-btip:hover{background:linear-gradient(135deg,rgba(0,212,255,.38),rgba(123,47,255,.38));'
      +'box-shadow:0 0 50px rgba(0,212,255,.55)!important;transform:translateY(-2px);}',
    '.'+u+'-btip:hover::before{left:130%;}',

    /* secondary cta */
    '.'+u+'-bdet{flex:1;min-width:108px;padding:.78rem .7rem;background:rgba(255,255,255,.04);'
      +'border:1px solid rgba(255,255,255,.14);border-radius:10px;cursor:pointer;'
      +'text-decoration:none;color:rgba(255,255,255,.5);font-size:.76rem;font-weight:600;'
      +'text-align:center;display:block;transition:all .2s;}',
    '.'+u+'-bdet:hover{background:rgba(255,255,255,.09);color:#fff;border-color:rgba(255,255,255,.35);}',

    /* dismiss */
    '.'+u+'-dis{display:block;width:100%;margin-top:.55rem;background:none;border:none;'
      +'cursor:pointer;color:rgba(255,255,255,.18);font-size:.6rem;letter-spacing:.18em;'
      +'text-transform:uppercase;padding:.28rem;transition:color .2s;font-family:inherit;'
      +'animation:'+u+'fu .4s ease 1.9s both;}',
    '.'+u+'-dis:hover{color:rgba(255,255,255,.5);}',

    /* footer */
    '.'+u+'-foot{margin-top:.5rem;font-size:.48rem;letter-spacing:.16em;text-transform:uppercase;'
      +'text-align:center;color:rgba(212,175,55,.25);animation:'+u+'fu .4s ease 2s both;}',

    /* shared fade-up */
    '@keyframes '+u+'fu{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}',
  ].join('\n');

  var sEl = document.createElement('style');
  sEl.textContent = css;
  document.head.appendChild(sEl);

  /* ── BUILD FEATURES HTML ─────────────────────────────────────── */
  var featHtml = (POPUP_CONFIG.features || []).map(function(f) {
    var fc = clsMap[f.cls] || 'pc';
    return '<div class="'+u+'-fc '+u+'-fc-'+f.cls+'">'
      +'<span class="'+u+'-fi">'+f.icon+'</span>'
      +'<p class="'+u+'-fl">'+f.label+'</p>'
      +'<p class="'+u+'-fd">'+f.desc+'</p>'
      +'</div>';
  }).join('');

  /* ── BUILD TIERS HTML ────────────────────────────────────────── */
  var tiersHtml = (POPUP_CONFIG.tiers || []).map(function(t) {
    return '<div class="'+u+'-tier '+u+'-tier-'+t.cls+'">'
      +'<span class="'+u+'-tbadge">'+t.badge+'</span>'
      +'<div class="'+u+'-tinfo">'
        +'<div class="'+u+'-thead">'
          +'<span class="'+u+'-trange">'+t.range+'</span>'
          +'<span class="'+u+'-tname">'+t.name+'</span>'
        +'</div>'
        +'<p class="'+u+'-tdesc">'+t.desc+'</p>'
      +'</div>'
      +'</div>';
  }).join('');

  var title = POPUP_CONFIG.title.replace('\n','<br>');

  /* ── BUILD DOM ───────────────────────────────────────────────── */
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
      +'<p class="'+u+'-pitch">'+POPUP_CONFIG.pitch+'</p>'

      +'<div class="'+u+'-div"></div>'

      +'<p class="'+u+'-slbl">What You Upgrade To</p>'
      +'<div class="'+u+'-feat">'+featHtml+'</div>'

      +'<div class="'+u+'-div"></div>'

      +'<p class="'+u+'-slbl">Choose Your Seat</p>'
      +'<div class="'+u+'-tiers">'+tiersHtml+'</div>'

      +'<div class="'+u+'-trust">'+POPUP_CONFIG.trust+'</div>'

      +'<div class="'+u+'-ctas">'
        +'<a href="'+POPUP_CONFIG.cta_href+'" class="'+u+'-btip">'+POPUP_CONFIG.cta_text+'</a>'
        +'<a href="'+POPUP_CONFIG.secondary_href+'" class="'+u+'-bdet" target="_blank">'+POPUP_CONFIG.secondary_text+'</a>'
      +'</div>'
      +'<button class="'+u+'-dis" id="'+u+'-dis">'+POPUP_CONFIG.dismiss_text+'</button>'
      +'<p class="'+u+'-foot">'+POPUP_CONFIG.nsp+'</p>'
    +'</div></div>';

  document.body.appendChild(ov);

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
