/**
 * SING 9 — no Supabase, no auth. Lite api-config for same-origin and optional Cash App.
 * When served from psw-vibelandia-sing9, API base is same-origin. Override via window.VIBELANDIA_API_BASE if needed.
 */
(function () {
  if (typeof window === 'undefined') return;
  if (window.VIBELANDIA_API_BASE !== undefined) return;
  var host = window.location.hostname || '';
  var isSing9Deploy = host === 'psw-vibelandia-sing9.vercel.app' || (host.endsWith('.vercel.app') && host.indexOf('psw-vibelandia-sing9') !== -1) || host === 'localhost' || host === '127.0.0.1';
  window.VIBELANDIA_API_BASE = isSing9Deploy ? window.location.origin : '';
})();

/**
 * Cash App client ID — optional. Injected at build from VIBELANDIA_PAYPAL_CLIENT_ID or PAYPAL_CLIENT_ID.
 * When empty, Cash App Pipes UI can still reference; no serverless in Sing9.
 */
(function () {
  if (typeof window === 'undefined') return;
  if (!window.VIBELANDIA_PAYPAL_CLIENT_ID) {
    window.VIBELANDIA_PAYPAL_CLIENT_ID = '';
  }
})();
