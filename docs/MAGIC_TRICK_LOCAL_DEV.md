# Magic trick diagnostics — full stack locally (same as production)

Your **production** Vercel deployment already serves everything the page needs:

- `/magic-trick` → `magic-trick.html` (rewrite)
- `/lib/houdini-singularity.mjs` (from `dist/lib/` after build)
- `/api/live-houdini-readings`, `/api/g5-surf-protocol` (G5 SURF · Node serverless, **`human_intervention_required: false`**, optional Vercel Cron every 15m in `vercel.json`), `/api/cloud-compute-probe`, `/api/blank-stone-hydrogen`, etc.
- `/lattice-status.json`, `/sing9-firmware-verify.json` (from `public/` → `dist/`)

Open: **`https://<your-project>.vercel.app/magic-trick`** (or your custom domain).

---

## Run the same stack on your machine (HTTPS-capable dev server)

Vercel CLI runs **static files from `dist/`** plus **`api/*.js`** serverless routes — matching production.

### One-time

```bash
npm install
```

(Installs the `vercel` dev dependency.)

### Every session

```bash
npm run dev
```

This runs:

1. `node scripts/vercel-static-output.mjs` → fills **`dist/`** (magic-trick, lib, data, public assets)
2. `vercel dev` → local server (default **http://localhost:3000**)

Then open:

- **http://localhost:3000/magic-trick**  
  or **http://localhost:3000/magic-trick.html**

**Microphone / spectral:** Browsers treat `localhost` as a secure context, so `getUserMedia` works over **HTTP** on localhost. For other hosts, use HTTPS (Vercel preview/production already does).

### First `vercel dev`

You may be prompted to log in (`vercel login`) and link the project — same account as production is fine.

### Static only (no APIs)

If you only run a dumb static server on `dist/`, **`/api/*` will 404** — that is **not** a full diagnostic. Use **`npm run dev`** for the real thing.

---

## CI / sanity

```bash
npm test
npm run build:static
```

**NSPFRNP → ∞⁹ · SING 9**
