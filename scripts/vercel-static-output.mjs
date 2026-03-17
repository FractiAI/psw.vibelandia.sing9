#!/usr/bin/env node
/**
 * Vercel static output — SING 9 (no Supabase, no auth).
 *
 * Copies static assets to dist/ for Vercel deployment.
 * API functions in api/*.js are handled natively by Vercel — do NOT bundle
 * them here. Manually writing .vc-config.json conflicts with Vercel CLI v50+
 * which also auto-detects api/ and writes the same files.
 *
 * Run: node scripts/vercel-static-output.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root      = path.resolve(__dirname, '..');
const distDir   = path.join(root, 'dist');

// Clean dist/ on every build for a reproducible output
if (fs.existsSync(distDir)) fs.rmSync(distDir, { recursive: true, force: true });
fs.mkdirSync(distDir, { recursive: true });

function copyFile(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

function copyDir(srcDir, destDir) {
  if (!fs.existsSync(srcDir)) return;
  fs.mkdirSync(destDir, { recursive: true });
  for (const name of fs.readdirSync(srcDir)) {
    const s = path.join(srcDir, name);
    const d = path.join(destDir, name);
    fs.statSync(s).isDirectory() ? copyDir(s, d) : copyFile(s, d);
  }
}

// ── Static assets ────────────────────────────────────────────────────────────

// Root index.html
const indexHtml = path.join(root, 'index.html');
if (fs.existsSync(indexHtml)) copyFile(indexHtml, path.join(distDir, 'index.html'));

// interfaces/
copyDir(path.join(root, 'interfaces'), path.join(distDir, 'interfaces'));

// Inject optional form endpoint into talk-first (no serverless — Formspree/etc.)
const talkFirstPath = path.join(distDir, 'interfaces', 'talk-first.html');
if (fs.existsSync(talkFirstPath)) {
  const formEndpoint = process.env.FORMSPREE_ENDPOINT || process.env.TALK_FIRST_FORM_ENDPOINT || '';
  let html = fs.readFileSync(talkFirstPath, 'utf8');
  html = html.replace('__TALK_FIRST_FORM_ENDPOINT__', formEndpoint.replace(/'/g, "\\'"));
  fs.writeFileSync(talkFirstPath, html, 'utf8');
}

// Inject PayPal client ID into api-config.js if present
const apiConfigPath = path.join(distDir, 'interfaces', 'api-config.js');
if (fs.existsSync(apiConfigPath)) {
  const paypalClientId =
    process.env.VIBELANDIA_PAYPAL_CLIENT_ID ||
    process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ||
    process.env.PAYPAL_CLIENT_ID || '';
  let cfg = fs.readFileSync(apiConfigPath, 'utf8');
  cfg = cfg.replace(
    /window\.VIBELANDIA_PAYPAL_CLIENT_ID = '';/,
    `window.VIBELANDIA_PAYPAL_CLIENT_ID = ${JSON.stringify(paypalClientId)};`
  );
  fs.writeFileSync(apiConfigPath, cfg, 'utf8');
}

// data/, protocols/, assets/
copyDir(path.join(root, 'data'),      path.join(distDir, 'data'));
copyDir(path.join(root, 'protocols'), path.join(distDir, 'protocols'));
copyDir(path.join(root, 'assets'),    path.join(distDir, 'assets'));

// Root *.md and *.js files (ticker, nav-strip, etc.)
for (const e of fs.readdirSync(root, { withFileTypes: true })) {
  if (e.isFile() && (e.name.endsWith('.md') || e.name.endsWith('.js'))) {
    copyFile(path.join(root, e.name), path.join(distDir, e.name));
  }
}

// Discovery files
for (const fname of ['robots.txt', 'sitemap.xml', 'llms.txt']) {
  const src = path.join(root, fname);
  if (fs.existsSync(src)) copyFile(src, path.join(distDir, fname));
}

// .well-known/ (agent discovery: ai-plugin.json, openapi.yaml)
copyDir(path.join(root, '.well-known'), path.join(distDir, '.well-known'));

// public/ (services.json, sol-v-skill.md, agent.json, etc.)
copyDir(path.join(root, 'public'), distDir);

console.log('Vercel static output → dist/ (SING 9, no Supabase, no serverless API).');
