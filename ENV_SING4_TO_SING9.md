# Env: Sing4 → Sing9

Reference for copying environment variables from the **Sing4** Vercel project to **Sing9**. Sing9 has no Supabase and no auth; only optional PayPal is relevant.

**Pipe type:** These keys are carried on the **Public-Free Key Pipe** (NSPFRNP): public info + free plans only, bypassing heavy security layers. See [protocols/PIPE_PUBLIC_FREE_KEY_NSPFRNP.md](protocols/PIPE_PUBLIC_FREE_KEY_NSPFRNP.md).

---

## Sing4 deployment (what it uses)

| Variable | Used by | Purpose |
|----------|---------|---------|
| `VIBELANDIA_SUPABASE_ANON_KEY` or `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Build (api-config.js) | Supabase anon key — **not used in Sing9** |
| `VIBELANDIA_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_URL` | Front-end / auth | Supabase URL — **not used in Sing9** |
| `VIBELANDIA_PAYPAL_CLIENT_ID` or `NEXT_PUBLIC_PAYPAL_CLIENT_ID` or `PAYPAL_CLIENT_ID` or `PAYPAL_CLIENT_ID_SANDBOX` | Build (api-config.js) | PayPal client ID for front-end — **optional in Sing9** |
| `PAYPAL_CLIENT_ID` / `PAYPAL_CLIENT_SECRET` (or `*_SANDBOX` / `*_LIVE`) | Serverless (PayPal create-order/capture-order) | PayPal API — **Sing9 has no serverless; no copy** |
| `PAYPAL_MODE` or `PAYPAL_LIVE` | Serverless | Sandbox vs live — **not used in Sing9** |
| `VIBELANDIA_GOOGLE_CLIENT_ID` or `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Auth / profile | Google OAuth — **not used in Sing9** |

---

## What to copy to Sing9

1. **In Vercel:** Sing4 project → **Settings → Environment Variables**. Note the values you care about.
2. **Sing9 project → Settings → Environment Variables:** add only:

   | Copy to Sing9 | When |
  |---------------|------|
   | **None** | Default. Sing9 runs fully static; no Supabase, no auth. |
   | `VIBELANDIA_PAYPAL_CLIENT_ID` or `PAYPAL_CLIENT_ID` | Only if you want PayPal Pipes (client-only) on Sing9; build injects it into `interfaces/api-config.js`. |

So: **move over what we need** = for current Sing9 you need **no** env vars. Optionally copy **PayPal Client ID** from Sing4 to Sing9 if you want the same client ID available for future PayPal Pipes UI.

---

## How to copy in Vercel

1. Open [Vercel Dashboard](https://vercel.com) → **psw.vibelandia.sing4** (or your Sing4 project) → **Settings** → **Environment Variables**.
2. Copy the **value** of `VIBELANDIA_PAYPAL_CLIENT_ID` or `PAYPAL_CLIENT_ID` (or `PAYPAL_CLIENT_ID_SANDBOX`) if you want it on Sing9.
3. Open **psw.vibelandia.sing9** → **Settings** → **Environment Variables** → **Add**:
   - **Name:** `VIBELANDIA_PAYPAL_CLIENT_ID` (or `PAYPAL_CLIENT_ID`)
   - **Value:** (paste from Sing4)
   - **Environments:** Production (and Preview if you want).
4. **Redeploy** Sing9 so the build runs with the new env (build injects it into api-config.js).

No Supabase or auth vars need to be copied to Sing9.

---

## Local setup (this repo)

- **.env** — Contains the keys you listed (GitHub, Groq, Google, Supabase, Stripe, Vercel, wallet). **Gitignored**; never committed.
- **.env.example** — Lists variable names only; copy to `.env` and fill if you need a clean template.
- For **Vercel**: add the same names/values in **psw-vibelandia-sing9** → Settings → Environment Variables (or use `vercel env pull` / paste from .env). Sing9 build only injects optional `VIBELANDIA_PAYPAL_CLIENT_ID` / `PAYPAL_CLIENT_ID` into api-config.js; other vars are available for future serverless or tooling.
