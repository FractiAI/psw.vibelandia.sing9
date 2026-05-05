/**
 * Vibelandia static i18n: browser language autosense, ?lang= override, localStorage.
 * Loads interfaces/i18n/en.json plus best-match locale file and deep-merges.
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'vibelandia_locale';
  var I18N_BASE = 'i18n/';

  var RTL_PREFIXES = ['ar', 'fa', 'ur', 'he', 'iw', 'yi', 'dv', 'ps', 'sd'];

  function normalizeTag(tag) {
    if (!tag || typeof tag !== 'string') return '';
    var t = tag.trim().replace('_', '-');
    if (!t) return '';
    var lower = t.toLowerCase();
    var map = {
      'zh-cn': 'zh',
      'zh-sg': 'zh',
      'zh-tw': 'zh-TW',
      'zh-hk': 'zh-TW',
      'zh-mo': 'zh-TW',
      'pt-br': 'pt',
      'iw': 'he',
      'in': 'id'
    };
    if (map[lower]) return map[lower];
    return t;
  }

  function isRtlLocale(tag) {
    var base = (tag || '').split('-')[0].toLowerCase();
    return RTL_PREFIXES.indexOf(base) !== -1;
  }

  function deepMerge(base, extra) {
    if (!extra || typeof extra !== 'object') return base;
    var out = Array.isArray(base) ? base.slice() : Object.assign({}, base);
    Object.keys(extra).forEach(function (k) {
      var ev = extra[k];
      var bv = out[k];
      if (
        ev &&
        typeof ev === 'object' &&
        !Array.isArray(ev) &&
        bv &&
        typeof bv === 'object' &&
        !Array.isArray(bv)
      ) {
        out[k] = deepMerge(bv, ev);
      } else {
        out[k] = ev;
      }
    });
    return out;
  }

  function get(obj, path) {
    if (!obj || !path) return undefined;
    return path.split('.').reduce(function (o, k) {
      return o == null ? o : o[k];
    }, obj);
  }

  function queryParamLang() {
    try {
      var q = new URLSearchParams(window.location.search).get('lang');
      return q ? normalizeTag(q) : '';
    } catch (e) {
      return '';
    }
  }

  function storedLang() {
    try {
      return normalizeTag(window.localStorage.getItem(STORAGE_KEY) || '');
    } catch (e) {
      return '';
    }
  }

  function browserCandidates() {
    var nav = window.navigator || {};
    var list = [];
    if (Array.isArray(nav.languages) && nav.languages.length) {
      list = nav.languages.slice();
    } else if (nav.language) {
      list = [nav.language];
    }
    return list.map(normalizeTag).filter(Boolean);
  }

  function candidateFilesForTag(tag) {
    var out = [];
    if (!tag) return out;
    out.push(tag);
    var i = tag.indexOf('-');
    if (i > 0) out.push(tag.slice(0, i));
    return out.filter(function (v, idx, a) {
      return a.indexOf(v) === idx;
    });
  }

  function resolveRequestedLocale() {
    var fromQ = queryParamLang();
    if (fromQ) return fromQ;
    var fromS = storedLang();
    if (fromS) return fromS;
    var cands = browserCandidates();
    for (var i = 0; i < cands.length; i++) {
      var files = candidateFilesForTag(cands[i]);
      for (var j = 0; j < files.length; j++) {
        if (files[j]) return files[j];
      }
    }
    return 'en';
  }

  function fetchJson(url) {
    return fetch(url, { credentials: 'same-origin' }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    });
  }

  function pickLocaleFile(requested, availableFromEn) {
    var files = candidateFilesForTag(requested);
    for (var i = 0; i < files.length; i++) {
      if (files[i] === 'en') return 'en';
    }
    for (var j = 0; j < files.length; j++) {
      if (files[j] && availableFromEn[files[j]]) return files[j];
    }
    return 'en';
  }

  function pageI18nRoot(page) {
    if (page === 'hood') return 'hood';
    if (page === 'fractai') return 'fractai';
    return 'qf';
  }

  function applyToDom(dict, page) {
    var root = pageI18nRoot(page);
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      if (!key || key.indexOf(root + '.') !== 0) return;
      var val = get(dict, key);
      if (val == null || val === '') return;
      el.textContent = val;
    });
    document.querySelectorAll('[data-i18n-html]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-html');
      if (!key || key.indexOf(root + '.') !== 0) return;
      var val = get(dict, key);
      if (val == null || val === '') return;
      el.innerHTML = val;
    });
    document.querySelectorAll('[data-i18n-attr]').forEach(function (el) {
      var spec = el.getAttribute('data-i18n-attr');
      if (!spec) return;
      var parts = spec.split('|');
      for (var i = 0; i < parts.length; i++) {
        var pair = parts[i].split(':');
        if (pair.length !== 2) continue;
        var attr = pair[0].trim();
        var key = pair[1].trim();
        if (key.indexOf(root + '.') !== 0) continue;
        var val = get(dict, key);
        if (val == null || val === '') continue;
        el.setAttribute(attr, val);
      }
    });

    var titleKey = root + '.meta.title';
    var t = get(dict, titleKey);
    if (t) document.title = t;

    function setMeta(sel, key) {
      var k = root + '.meta.' + key;
      var v = get(dict, k);
      if (!v) return;
      var m = document.querySelector(sel);
      if (m) m.setAttribute('content', v);
    }
    setMeta('meta[name="description"]', 'desc');
    setMeta('meta[property="og:title"]', 'ogTitle');
    setMeta('meta[property="og:description"]', 'ogDesc');
    setMeta('meta[name="twitter:title"]', 'ogTitle');
    setMeta('meta[name="twitter:description"]', 'ogDesc');
  }

  function injectLangBar(effectiveLocale, requestedLocale, dict, page) {
    if (document.getElementById('vbi18n-bar')) return;
    var root = pageI18nRoot(page);
    var labelKey = root + '.langBar.label';
    var partialKey = root + '.langBar.partialFallback';
    var label = get(dict, labelKey) || 'Language';
    var hint = '';
    if (effectiveLocale === 'en' && requestedLocale !== 'en') {
      hint = get(dict, partialKey) || '';
    }
    var bar = document.createElement('div');
    bar.id = 'vbi18n-bar';
    bar.setAttribute(
      'style',
      'position:fixed;bottom:0;left:0;right:0;z-index:9999;padding:.45rem .65rem;font-size:.72rem;' +
        'background:rgba(6,8,13,.92);border-top:1px solid rgba(212,175,55,.35);color:#94a3b8;' +
        'display:flex;flex-wrap:wrap;align-items:center;gap:.5rem;justify-content:center;'
    );
    var span = document.createElement('span');
    span.textContent = label + ': ';
    span.style.color = '#e2e8f0';
    var sel = document.createElement('select');
    sel.setAttribute('aria-label', label);
    sel.style.cssText =
      'background:#0f141c;color:#fef3c7;border:1px solid rgba(212,175,55,.4);border-radius:4px;padding:.25rem .4rem;font-size:.72rem;max-width:min(280px,90vw);';

    var shipped = Object.keys(dict.__locales__ || {});
    var codes = shipped.filter(function (c) {
      return c !== 'en';
    });
    codes.sort();
    codes.unshift('en');

    var dn = null;
    try {
      dn = new Intl.DisplayNames(['en'], { type: 'language' });
    } catch (e1) {}

    function optionLabel(code) {
      if (code === 'zh') return dn ? dn.of('zh') + ' (' + code + ')' : 'Chinese (' + code + ')';
      if (code === 'zh-TW') return 'Chinese, Traditional (zh-TW)';
      var base = code.split('-')[0];
      if (dn) {
        try {
          return dn.of(base) + ' (' + code + ')';
        } catch (e2) {}
      }
      return code;
    }

    codes.forEach(function (code) {
      var opt = document.createElement('option');
      opt.value = code;
      opt.textContent = optionLabel(code);
      if (code === effectiveLocale) opt.selected = true;
      sel.appendChild(opt);
    });

    sel.addEventListener('change', function () {
      try {
        window.localStorage.setItem(STORAGE_KEY, sel.value);
      } catch (e) {}
      var url = new URL(window.location.href);
      url.searchParams.set('lang', sel.value);
      window.location.href = url.toString();
    });

    bar.appendChild(span);
    bar.appendChild(sel);
    if (hint) {
      var h = document.createElement('span');
      h.style.cssText = 'opacity:.85;max-width:42ch;';
      h.textContent = hint;
      bar.appendChild(h);
    }
    document.body.appendChild(bar);
    document.body.style.paddingBottom = '3.25rem';
  }

  function setDocumentLocale(effective) {
    var html = document.documentElement;
    if (effective === 'zh') html.setAttribute('lang', 'zh-Hans');
    else if (effective === 'zh-TW') html.setAttribute('lang', 'zh-Hant');
    else html.setAttribute('lang', effective);
    if (isRtlLocale(effective)) html.setAttribute('dir', 'rtl');
    else html.setAttribute('dir', 'ltr');
  }

  function initFromPage(page) {
    var requested = resolveRequestedLocale();
    var baseUrl = I18N_BASE + 'en.json';

    fetchJson(baseUrl)
      .then(function (en) {
        var available = en.__locales__ || {};
        var effective = pickLocaleFile(requested, available);
        if (effective === 'en') {
          return { dict: en, effective: 'en', requested: requested };
        }
        return fetchJson(I18N_BASE + effective + '.json')
          .then(function (loc) {
            return { dict: deepMerge(en, loc), effective: effective, requested: requested };
          })
          .catch(function () {
            return { dict: en, effective: 'en', requested: requested };
          });
      })
      .then(function (res) {
        var dict = res.dict;
        var eff = res.effective;
        var req = res.requested;
        setDocumentLocale(eff);
        applyToDom(dict, page);
        injectLangBar(eff, req, dict, page);
        window.__VIBELANDIA_I18N__ = { locale: eff, requested: req, page: page };
      })
      .catch(function () {
        console.warn('i18n-auto: failed to load en.json');
      });
  }

  window.VibelandiaI18n = {
    initFromPage: initFromPage,
    normalizeTag: normalizeTag
  };
})();
