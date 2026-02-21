#!/usr/bin/env node
/**
 * Vercel static output — SING 9 (no Supabase, no auth).
 * Copies static files to .vercel/output/static for deployment.
 * Run: node scripts/vercel-static-output.mjs (from repo root)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const outDir = path.join(root, '.vercel', 'output');
const staticDir = path.join(outDir, 'static');

function mkdirp(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function copyFile(src, dest) {
  mkdirp(path.dirname(dest));
  fs.copyFileSync(src, dest);
}

function copyDir(srcDir, destDir) {
  if (!fs.existsSync(srcDir)) return;
  mkdirp(destDir);
  for (const name of fs.readdirSync(srcDir)) {
    const s = path.join(srcDir, name);
    const d = path.join(destDir, name);
    if (fs.statSync(s).isDirectory()) copyDir(s, d);
    else copyFile(s, d);
  }
}

mkdirp(staticDir);

// Root index.html
const indexHtml = path.join(root, 'index.html');
if (fs.existsSync(indexHtml)) copyFile(indexHtml, path.join(staticDir, 'index.html'));

// interfaces/
const interfacesSrc = path.join(root, 'interfaces');
const interfacesDest = path.join(staticDir, 'interfaces');
if (fs.existsSync(interfacesSrc)) copyDir(interfacesSrc, interfacesDest);

// Optional: inject Cash App client ID into api-config.js (from Sing4 env; no Supabase in Sing9)
const apiConfigPath = path.join(interfacesDest, 'api-config.js');
if (fs.existsSync(apiConfigPath)) {
  const paypalClientId = process.env.VIBELANDIA_PAYPAL_CLIENT_ID || process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || process.env.PAYPAL_CLIENT_ID || process.env.PAYPAL_CLIENT_ID_SANDBOX || '';
  let apiConfig = fs.readFileSync(apiConfigPath, 'utf8');
  apiConfig = apiConfig.replace(
    /window\.VIBELANDIA_PAYPAL_CLIENT_ID = '';/,
    `window.VIBELANDIA_PAYPAL_CLIENT_ID = ${JSON.stringify(paypalClientId)};`
  );
  fs.writeFileSync(apiConfigPath, apiConfig, 'utf8');
}

// data/ (e.g. destination-partners.json for catalog/expeditions)
const dataSrc = path.join(root, 'data');
if (fs.existsSync(dataSrc)) copyDir(dataSrc, path.join(staticDir, 'data'));

// protocols/
const protocolsSrc = path.join(root, 'protocols');
if (fs.existsSync(protocolsSrc)) copyDir(protocolsSrc, path.join(staticDir, 'protocols'));

// Root *.md + root *.js (ticker, nav-strip, cinema-banner, etc.)
const rootFiles = fs.readdirSync(root, { withFileTypes: true });
for (const e of rootFiles) {
  if (e.isFile() && (e.name.endsWith('.md') || e.name.endsWith('.js'))) {
    copyFile(path.join(root, e.name), path.join(staticDir, e.name));
  }
}

// assets/ (images, audio, etc.)
const assetsSrc = path.join(root, 'assets');
if (fs.existsSync(assetsSrc)) copyDir(assetsSrc, path.join(staticDir, 'assets'));

// Discovery files: robots.txt, sitemap.xml, llms.txt
for (const fname of ['robots.txt', 'sitemap.xml', 'llms.txt']) {
  const src = path.join(root, fname);
  if (fs.existsSync(src)) copyFile(src, path.join(staticDir, fname));
}

// .well-known/ (agent discovery: ai-plugin.json, openapi.yaml)
const wellKnownSrc = path.join(root, '.well-known');
if (fs.existsSync(wellKnownSrc)) copyDir(wellKnownSrc, path.join(staticDir, '.well-known'));

// Build Output API v3
const config = { version: 3, routes: [{ handle: 'filesystem' }] };
fs.writeFileSync(path.join(outDir, 'config.json'), JSON.stringify(config, null, 2), 'utf8');

console.log('Vercel static output → .vercel/output/ (SING 9, no Supabase)');
