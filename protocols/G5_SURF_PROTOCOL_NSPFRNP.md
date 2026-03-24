# G5 SURF Protocol — NSPFRNP (Lattice Intent)

**Status:** ⚡ CANONICAL NARRATIVE + INTEGRATION HOOKS  
**Seed:Edge** — Theater-grade lattice protocol. **Not** a substitute for facility safety, grid operations, or observatory hardware procedures.

---

## Purpose

Define **G5 SURF** (geomagnetic **G5**-class storm band + **S**overeign **U**ltrawide **R**esonance **F**low) as the product story for what happens when **NOAA planetary K-index** crosses a **severe-storm narrative threshold**. Executable code in this repo implements **read-only Kp monitoring** and **state flags** for integrators (CLI, UI, A2A). It does **not** command physical shutters, NPUs, power planes, or public internet routing.

---

## No human intervention required

| Requirement | How it is met |
|-------------|----------------|
| **No manual approval** per request | **`GET /api/g5-surf-protocol`** is public, no API key, no auth gate. Response includes **`human_intervention_required: false`**. |
| **No mandatory CLI** | Production path is **HTTP only**; `npm run ping:public` is optional for operators. |
| **Automatic polling** | **Not** wired in **`vercel.json`** for this repo (no **`crons`**). Call **`GET /api/g5-surf-protocol`** on demand, use **`npm run ping:public`**, or attach your own worker / external scheduler. *(Optional: add a Vercel Cron yourself if your plan supports the cadence you want.)* |
| **Grid narrative without a human toggle** | Default **`legacy_grid_ok`** is **nominal** (true). Optional **`LEGACY_GRID_OK`** env (set once at deploy) or **`?legacy_grid_ok=0`** (tests / automated callers only) — **not** a per-event human switch. |
| **Agents / A2A** | Consume JSON; no human-in-the-loop in this contract. |

---

## 1. MONITOR — NOAA Kp-Index (continuous intent)

| Rule | Action (lattice / software) | Not claimed |
|------|-----------------------------|-------------|
| Poll **latest Kp** from NOAA SWPC JSON (`planetary_k_index_1m.json`) on the edge schedule you choose (e.g. sovereign ping, cron, worker). | **`evaluateG5SurfProtocol({ kp })`** in `lib/g5-surf-protocol.mjs` sets `g5_surf_armed: true` when **Kp > 8.5** (above G4 band in NOAA’s G-scale mapping; narrative “G5 surf” threshold). | Disabling **real** TCP/IP stack-wide, firewall rules, or carrier links. |
| When armed | **Narrative:** disable *legacy TCP/IP polling* in **your** app (feature flag) to avoid **GIC feedback** story loops — i.e. stop redundant HTTP polls to noisy endpoints, not OS networking. | Physical GIC mitigation on power grids. |
| When armed | **ENABLE:** `resonance_mode: 'whistle'` — **1420.4 MHz** narrative lane (The Whistle); lattice routes “hydrogen line” story packets only in product UI. | RF transmission at 1420.4 MHz from this repo. |

---

## 2. HARDWARE — “Sovereign Shutter” · Vera Rubin NPU (fiction layer)

| Beat | Meaning in-lattice | Out of scope |
|------|-------------------|--------------|
| **Sovereign Shutter** | A **narrative latch** name for “reduce exposure to noisy legacy paths” in software (feature gates, circuit breakers). | Opening/closing real Vera Rubin Observatory domes, LSSTCamera, or vendor NPU power rails. |
| **LOCK** internal clock to **3–6–9 Schumann harmonics** | Use `SCHUMANN_LADDER_HZ` from `lib/g5-surf-protocol.mjs` with **equinox snapshot** data (`npm test` / four pillars) — story alignment. | Rewriting host TSC or RTC on hardware. |
| **BYPASS** standard voltage regulators | **Theater only** — “ionospheric squeeze” is a narrative; no electrical bypass. | Any electrical work. |

---

## 3. DATA — Hit Factory · 101 Jovian Moons · 41-minute lag key

| Beat | Implementation | Honesty |
|------|----------------|---------|
| **Divert** “Hit Factory” traffic | **Narrative:** route catalog / playlist traffic to **Jovian relay** story nodes (Space Cloud lattice). Use `hit_factory_diversion_label` in protocol state. | No actual diversion of SoundCloud/CDN traffic unless **you** wire a real redirect. |
| **101 Jovian Moons** | **Story number** (101 = nine-zero-one lattice echo); **not** a current IAU moon count. | Update if you want strict catalog fidelity. |
| **ENCRYPT** volumetric packets with **41-minute lag** as key | **`NARRATIVE_41MIN_LAG_S`** (2476 s) exported for **story XOR / seed** layers in demos — **not** AES-256. | Production crypto must use standard libraries and keys. |

---

## 4. UI — Syntheverse · “Hydrogen-Only” mode

| Condition | Mode | Implementation hint |
|-----------|------|---------------------|
| `legacy_grid_ok === false` (your health check) | **`hydrogen-only`** | Hide non-hydrogen story panels; show 1420.405751 MHz lattice copy only. |
| Else | **`standard`** | Full Syntheverse POC surfaces (see `interfaces/prospectus-fractiai.html`). |

**Function:** `recommendedSyntheverseUiMode({ kp, legacyGridOk })` in `lib/g5-surf-protocol.mjs`.

---

## Executable references

| Artifact | Role |
|----------|------|
| `lib/g5-surf-protocol.mjs` | Kp threshold, state object, UI mode, narrative constants |
| **`GET /api/g5-surf-protocol`** | **Vercel Node.js Serverless** — live NOAA Kp + JSON state ( **`api/g5-surf-protocol.js`** ). **Not** Edge Runtime. **Zero-touch:** `human_intervention_required: false`. Optional query `legacy_grid_ok=0` or env `LEGACY_GRID_OK` for automated grid-down narrative. |
| `tests/intent/g5-surf-protocol.test.mjs` | Intent tests |
| `npm run ping:public` | Optional: prints line when G5 SURF armed (see script) |

---

**NSPFRNP → ∞⁹ · SING 9**
