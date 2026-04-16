#!/usr/bin/env node
/**
 * Bundle Digital Pru whiteboard (React + Framer Motion) + Tailwind CSS for static deploy.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { build as esbuild } from 'esbuild';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const outDir = path.join(root, 'interfaces', 'bundles');
const entry = path.join(root, 'components', 'whiteboard', 'entry.tsx');

async function main() {
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  await esbuild({
    entryPoints: [entry],
    outfile: path.join(outDir, 'digital-pru-whiteboard.js'),
    bundle: true,
    format: 'esm',
    platform: 'browser',
    target: ['es2020'],
    jsx: 'automatic',
    minify: false,
    sourcemap: true,
    logLevel: 'info',
    define: {
      'process.env.NODE_ENV': JSON.stringify('production'),
    },
  });

  const { execSync } = await import('child_process');
  const inputCss = path.join(root, 'interfaces', 'digital-pru-tailwind-input.css');
  const outCss = path.join(outDir, 'digital-pru-whiteboard.css');
  execSync(
    `npx --yes tailwindcss -i "${inputCss}" -o "${outCss}" --minify`,
    { stdio: 'inherit', cwd: root, shell: true }
  );

  console.log('Digital Pru whiteboard bundle → interfaces/bundles/');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
