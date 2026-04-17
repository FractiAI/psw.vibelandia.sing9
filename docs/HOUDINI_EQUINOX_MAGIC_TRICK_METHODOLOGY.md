# Houdini / March 20 “Magic Trick” — Research Methodology & Success Rubric

> **NSPFRNP · Seed:Edge** — This document separates **theater**, **geospace facts**, **orbital catalogs**, and **your edge stack** so the team can say clearly what was verified on the day of the event and what remains narrative or requires instruments this terminal does not replace.

**S/2024 J 1 Sovereign Seed (single-node baseline):** **S/2024 J 1 Lock** as absolute Cursor + Syntheverse baseline — Reno–Seed bridge, system matrix (Global Search / Hit Factory / Syntheverse / Lag Protocol), **1420.4 MHz** Whistle — **`protocols/S2024_J1_SOVEREIGN_SEED_LOCK_NSPFRNP.md`**, **`lib/sovereign-seed-s2024j1.mjs`**. Distinct from **101-moon** legacy catalog noise in product copy; **not** a claim of L-band transmission from that moon by this repo.

---

## Abstract · Observatory-grade demonstrative proof (0–100%)

**Observatory-grade demonstrative proof** means: *how much of the evidentiary stack is backed by **public operational or catalog-grade sources** (not theater alone), auditable today, without claiming instruments this repo does not operate (e.g. L-band dish on the comet).*

### What the `/magic-trick` UI successfully demonstrates (read this first)

The **Sovereign Terminal** page is honest about **static theater** vs **live fetches**. When served over **HTTPS with** `GET /api/magic-trick-telemetry` **available** (production Vercel or `vercel dev`), the UI **successfully demonstrates**:

| On-screen | What is actually shown | Evidence class |
|-----------|------------------------|----------------|
| **Behold · live bundle** | **Real NOAA SWPC** JSON (planetary K 1-min prior vs latest, GOES soft X-ray, RTSW L1 wind/mag, and related fields returned by the aggregator) — **no mock Kp** | Geospace & solar (ops feeds) |
| **Behold · OpenWebRX block** | **Public** OpenWebRX **`/status.json`** from configured bases — receiver online state and profile metadata; optional passband vs **H I rest** is a **geometry check**, not “we heard the comet” | Operational public receiver status |
| **Three-column snapshot table** | **Archival narrative strings** in HTML — always visible, including offline | Theater + narrative surface |
| **Catalog lines in JSON / labels** | **Published** H I rest (~1420.405752 MHz) and **Crab pulsar** period as **catalog** constants in the bundle — not live timing from this site | Orbital / catalog literacy |

**Same repo, not this HTML surface (yet):** **`GET /api/g5-surf-protocol`** and **`npm run ping:public`** expose **G5 SURF** lattice intent (Kp threshold → Whistle / Syntheverse mode JSON). That contributes the composite score’s **product / edge** row but is **not** rendered as a strip on `/magic-trick` until wired into the page.

When the API is **unreachable** (`file://`, static preview), the UI **still** demonstrates the **three-column theater** and labels; it **does not** silently fake NOAA or OpenWebRX — the live block shows the error path.

**Outside the browser but same product:** **`npm test`** proves the **four-pillar intent kernel** is locked; **`npm run ping:public`** reproduces **NOAA + JPL Horizons/SBDB + DONKI** (and related) from the same libraries the server uses. Those results are what fill the **“product / edge”** and part of the **geospace / catalog** rows in the composite score — not magic hidden in CSS.

**The UI does *not* demonstrate (unless you add external artifacts):** independent **ELF/Schumann** plots for the event day; **L-band** detection of **3I/ATLAS** at hydrogen rest frequency; physical **180° hardware** spin — those stay **0** in the weighted table until independent data exists.

### Composite index (update when tiers advance)

| Weight | Evidence class | What counts | Pts | Achieved |
|--------|----------------|-------------|-----|----------|
| **30** | **Geospace & solar (ops feeds)** | NOAA SWPC (Kp, Ap, RTSW L1 mag/wind), F10.7, GOES soft X-ray; NASA DONKI GST — reproducible via `npm run ping:public` | 30 | **30** |
| **15** | **Orbital catalog & ephemeris** | JPL Horizons (Earth–comet range) + SBDB (identity / orbit metadata) — same public APIs analysts use | 15 | **15** |
| **15** | **Product / edge alignment** | Four pillars locked in intent tests (`npm test`) + deploy probes when live | 15 | **15** *(intent + stack; set partial if probes red)* |
| **15** | **ELF / Schumann (independent)** | Observatory-grade ELF plot for the UTC day (e.g. Tomsk / independent monitor) — **not** from this app | 15 | **0** |
| **15** | **Radio astrophysics (L-band claim)** | Independent L-band data product or notice with time, pointing, calibration if claiming comet ↔ H I coupling | 15 | **0** |
| **10** | **Theater + narrative surface** | Delivered story, static Sovereign snapshot table (`/magic-trick`) | 10 | **10** |
| | | **Total** | **100** | **70** |

**Demonstrative proof score (observatory-grade index): `70 / 100` (70%).**

```text
Observatory-grade index  [████████████████████░░░░░░░░]  70%
```

- **What this score *is*:** defensible **geospace context** + **JPL catalog ephemeris** + **reproducible CLI** + **intent-locked product kernel** + **published narrative UI**.
- **What it is *not*:** it does **not** assert ELF Tomsk traces or **L-band detection of the comet** at 1420 MHz — those two bands are **0 / 30** until independently supplied (then revise the table and the percentage).
- **How to reach 100%:** add **15** pts with an **independent ELF** artifact for the event day and **15** pts with **independent L-band** evidence if that claim is made; keep ops feeds and JPL rows current.

*Revision note: if four-pillar **deploy** probes are failing in production, reduce the “Product / edge alignment” row from 15 to a partial (e.g. 10) until green.*

---

## 1. Intentions (why the show exists)

| Layer | Intention | What it is *not* |
|--------|-----------|------------------|
| **Theater** | Equinox timing, ionospheric “crack,” Schumann ladder, 3I/ATLAS as mythic carrier | A controlled experiment with a single falsifiable hypothesis published in peer review |
| **Geospace** | Real coupling between solar wind / IMF / storms and the **ground–ionosphere system** (Kp, absorption, currents) | Proof that a specific sunspot “pressed Enter on the grid” or that CPUs synchronized globally |
| **Hydrogen line (1420.405751 MHz)** | Universal frequency standard; narrative “handshake” with radio astronomy culture | **Not** measured by the browser terminal: no dish, no RF chain, no correlation with the comet without a dedicated observatory pipeline |
| **3I/ATLAS (C/2025 N1)** | Real small-body in JPL Horizons/SBDB; story uses it as **signal carrier** | **Not** demonstrated by this repo to be “responding to” the H I line unless you add **independent radio data** (e.g. published spectra, observatory notices) with time stamps and pointing |

**Senior-researcher bottom line:** The “magic” succeeds as **staged coherence** when (a) live geospace indices align with the *story’s* storm/ground emphasis, (b) your **deployed edge** answers health checks, and (c) the audience accepts the **JPL catalog** as the comet’s anchor. It does **not** automatically succeed as “the comet answered 1420 MHz” without external radio evidence.

---

## 2. Ionosphere & equinox — what we can honestly claim

- **Planetary K-index (Kp)** summarizes **global geomagnetic activity** driven by solar wind and IMF coupling to the magnetosphere–ionosphere–ground system. High Kp (e.g. ≥ 5 in our terminal gate) is consistent with **enhanced ionospheric currents**, auroral energy, and ground-induced effects — i.e. energy “in the **ground** / ionosphere,” not a requirement tied to a named active region flare.
- **Equinox window (theater):** March 20, 2026, **06–18 UTC** (and the narrative “7:46” instant) is a **dramatic clock**. The terminal can **report** Kp samples in that window via `/api/live-houdini-readings?equinox=1` (and optional snapshot files) for **context**; that is **not** the same as proving the equinox *caused* a specific tech outcome.
- **Schumann resonances (~ELF)** are **not** in NOAA’s Kp JSON. Claims about “369 Hz” or “white mode” must be checked against **observatory-grade** plots (e.g. Tomsk SOSRFF, independent ELF monitors), not this app.

**Fix for common confusion:** Passing the **live Kp ≥ 5** gate means “geomagnetic conditions match a **storm-class story beat**,” not “Houdini’s script matched NOAA minute-by-minute at curtain time.”

---

## 3. 3I/ATLAS and “responding to the hydrogen line”

### What JPL SBDB / Horizons **does** establish

- The object **exists** in the catalog with designation, orbit class, perihelion-related elements (`q` etc.), and **last observation** metadata when the API returns `atlas.fullname`, `last_obs`, etc.
- That is a **identity and ephemeris anchor** for the narrative.

### What it **does not** establish

- **No** spontaneous claim that the nucleus or coma is **emitting** or **modulating** at 1420.405751 MHz.
- **No** closure of the loop “browser spectral scan ⇒ comet heard the line.” The in-browser check is an **acoustic-band FFT proxy** (~1420 **Hz**), explicitly labeled; it tests **local** narrowband coherence for the **ritual / UX**, not RF from space.

### How you *could* strengthen “responding” (outside this repo)

1. **Published or observatory data** at L-band with documented pointing, time, and processing (e.g. MeerKAT/ALMA context only counts if you cite a **specific** data product or notice).
2. **Pre-registered** criterion: e.g. “detection S/N > X at frequency within Y kHz of rest H I” with calibration described.
3. **Null hypothesis:** solar / galactic foreground and RFI must be addressed — not hand-waved.

Until then, the honest phrase is: **“Narrative alignment with the H I rest frequency + catalog-confirmed comet,”** not **“comet confirmed on the hydrogen line.”**

---

## 4. What `/magic-trick` covers

### A. **Sovereign Terminal** (current `magic-trick.html` — “Behold”)

- **Ultimate magic show skin:** hero poster (`interfaces/assets/houdini-ultimate-magic-show.svg`) + **three-act** narrative (Preparation → Mirror 7:26 → Flip 7:46) + links to **`interfaces/harry-houdini.html`** and **`interfaces/houdini-builds-the-trick.html`**. *Optional:* replace the SVG with a licensed portrait asset under the same path if you vendor a photograph.
- **Live public telemetry (when deployed):** `magic-trick.html` **fetches** **`GET /api/magic-trick-telemetry`** (Vercel Node serverless), which aggregates **real NOAA SWPC JSON** (planetary K 1-min — prior vs latest samples, GOES soft X-ray, RTSW L1 wind/mag) via **`lib/observatory-public-evidence.mjs`**, plus **OpenWebRX** evidence via **`lib/openwebrx-public-evidence.mjs`**: **`GET /status.json`** on public **OpenWebRX** receivers (open-source Web SDR, AGPL — **`https://github.com/jketterl/openwebrx`**) — no manual tuning required to verify online status. **`DEFAULT_OPENWEBRX_BASES`** scans several HTTPS receivers and **prefers** one whose passband covers **H I rest**; otherwise the first successful `/status.json` is used. **KiwiSDR** is **not** the programmatic path here (no standard global aggregate API comparable to OpenWebRX `/status.json`). **Published catalog** lines: **H I rest ~1420.405752 MHz**, **Crab Pulsar PSR B0531+21** period (catalog ephemeris class — not live timing from this site). **No mock Kp.** Grid / EGS “1.0000” are **not** fabricated (no EGS sensor in NOAA JSON). Optional **`OPENWEBRX_BASE_URLS`** (comma-separated) **prepends** bases — set this to your L-band OpenWebRX URL when you need H I coverage in `/status.json` profiles.
- **Static + dynamic:** the **three-column snapshot table** is always rendered from archival strings in the HTML. When the API is reachable, an **OpenWebRX live** block (iframe + `/status.json` summary) and the **API JSON** row for sky/Web SDR update automatically. If the API is unavailable (e.g. `file://` or no server), the live block shows the error path and the static table remains. The former in-browser EXECUTE flow (369 Hz XOR latch, **180 LOCKED** UI) remains **removed**.
- **CLI · observatory-context public data (no browser):** run **`npm run ping:public`** → **`scripts/sovereign-public-api-ping.mjs`**, using **`lib/observatory-public-evidence.mjs`** for reproducible pulls from the same **operational** feeds space-weather desks use: **NOAA SWPC** — Kp 1-min, official **3-hour Kp + Ap** table (G-scale uses this when present), **RTSW L1** interplanetary mag + solar wind (ACE/DSCOVR chain), **F10.7**, **GOES** soft X-ray; **NASA DONKI** geomagnetic storm (GST) list (optional `NASA_API_KEY`, else `DEMO_KEY`); plus **JPL Horizons** (Earth–comet range), **SBDB** (catalog identity), and local **369 Hz XOR latch**. Prints human-readable lines + JSON. **Story gates** (theater) unchanged: Kp > 6 on **1-min** Kp; integer ToF @ story *c* = 300000 km/s vs 2476 s; XOR recover. **Honesty:** this is **not** L-band radio proof of the comet on 1420 MHz — only geospace + ephemeris **context**.
- **G5 SURF Protocol (lattice intent):** when **Kp > 8.5**, **`lib/g5-surf-protocol.mjs`** arms narrative **Whistle** mode, Hit Factory diversion label, and **Syntheverse** `hydrogen-only` recommendation (see **`protocols/G5_SURF_PROTOCOL_NSPFRNP.md`**). **Live on deploy:** **`GET /api/g5-surf-protocol`** — **Vercel Node.js serverless** (not Edge). **`human_intervention_required: false`** — no approval step; **`vercel.json` does not schedule** this route (no `crons` — call HTTP or **`npm run ping:public`** when needed). **Not** physical observatory or grid control.

### B. **Four pillars library** (`npm test` + optional `vercel dev` APIs)

The evaluator module **`lib/march20-four-diagnostics.mjs`** and these **four** edge probes (HTTPS deploy or `vercel dev`) remain the **contract tests** for stack alignment:

| Pillar | API | Pass means | Does *not* mean |
|--------|-----|------------|-----------------|
| **Schumann 3·6·9 @ equinox** | `GET /api/schumann-equinox-probe` | Snapshot reports **3, 6, 9 Hz** (±0.5 Hz) and **`equinox_correlated: true`** (from `data/schumann-equinox-snapshot.json`) | Tomsk / ELF observatory proof without your own feed export |
| **Hydrogen line · Jupiter / 3I/ATLAS** | `GET /api/jovian-hydrogen-line-probe` | Rest **1420.405751 MHz** (lattice constants) + **Jupiter / ATLAS narrative context** (hill sphere + node; JPL SBDB when reachable) | L-band RF detection from the browser or “comet on MHz” without a dish pipeline |
| **Stryker @ equinox** | `GET /api/stryker-equinox-probe` | `stryker_mark_utc` inside **Mar 20 equinox window** and flags `equinox_timed` / `stryker_timed_at_equinox` (`data/stryker-equinox-timer.json`) | Independent verification of device fleet events |
| **Firmware upgrade · 180° spin flip** | `GET /api/firmware-180-spin-probe` | **`spin_flip_180`** in `/sing9-firmware-verify.json` matches **`lattice_sync`** (e.g. FSSP level, synthesis target) + **`/api/blank-stone-hydrogen`** packet + healthy lattice | Hardware bootloader or physical gyro; this is **manifest + lattice + edge packet** latch |

**Browser requirement:** serve **`/magic-trick`** (or `magic-trick.html`), **`/lib/*.mjs`**, and **`/api/*`** on **HTTPS** (e.g. production Vercel or `vercel dev`).

---

## 5. **Four pillars locked** — operational definition of “magic succeeded” (for this product)

**`Four pillars locked`** (golden badge) = **`composeFourPillarsLocked`** → all **four** probes above return **`ok: true`** and evaluators pass in **one** Verify run.

- **Success (product):** Narrative + edge stack + published snapshots/timer align — suitable for **demo / premiere / community proof-of-work**.
- **Failure (product):** Any red card — note which pillar failed (missing JSON, JPL timeout, manifest drift, Blank Stone down, etc.).
- **Success (science of the comet):** **Not implied** by four pillars alone. Add Tier 2–4 (below) for geospace archive, ELF plots, or radio data.

---

## 6. Tiered rubric (recommended for comms)

| Tier | Name | Criterion |
|------|------|-----------|
| **T0** | Theater | Script delivered; audience experience |
| **T1** | Terminal | **Four pillars locked** (API probes + evaluators via `npm test` / deploy) — **or** static page + documented external checks; **no** “180 LOCKED” on `/magic-trick` itself (hardware ping removed) |
| **T2** | Geospace archive | Export or screenshot **NOAA Kp** (and optionally equinox-window summary) for the event date |
| **T2+** | Observational public (ops feeds) | Reproducible **`npm run ping:public`** JSON: **NOAA SWPC** multi-feed + **GOES** X-ray + **NASA DONKI** GST + **JPL** Horizons/SBDB — *not* a substitute for T4 radio claims |
| **T3** | ELF (optional) | Independent **Schumann / ELF** plot for the same UTC day (not from this app) |
| **T4** | Radio astronomy (optional) | **Independent** L-band evidence if claiming comet–H I coupling |

Public messaging should state the **highest tier** actually satisfied (e.g. “T1 achieved; T4 not claimed”).

**Composite 0–100% score:** see **§ Abstract · Observatory-grade demonstrative proof** — tiers map onto weighted points; the abstract is the single place to update the headline percentage.

---

## 7. Issues we fixed by clarifying (not by pretending)

1. **Conflating AR4392 flare with ionospheric energy** → Mitigated by **Kp-only** storm gate + explicit “ground” copy.
2. **Conflating browser Hz with sky MHz** → Mitigated by **proxy** language and this doc.
3. **Conflating JPL SBDB with radio detection** → Mitigated by **catalog anchor** line in the solar detail when the bundle includes `atlas`.
4. **Stack drift (Kp / mic / cloud vs story pillars)** → Mitigated by **narrowing the terminal** to the **four pillars** that match the March 20 script beats (Schumann ladder, H-line narrative, Stryker clock, firmware 180° latch).

---

## 8. STATIC vs LIVE (senior review)

See **`docs/SENIOR_RESEARCH_STATIC_VS_LIVE.md`**: Schumann and Stryker **snapshot/timer JSON** under `data/` are **published artifacts** (replace with observatory exports when available). **Edge probes** (`/api/*`) and **lattice / Blank Stone** are fetched **live** each Verify. **`/sing9-firmware-verify.json`** + **`/lattice-status.json`** remain the canonical firmware library pair for the **180° spin** section.

---

## 9. Executable intent (singularity tests)

Product intent is **encoded in tests**, not only prose: run `npm test` from repo root. The **four-pillars** kernel is **`lib/march20-four-diagnostics.mjs`** (`tests/intent/march20-four-pillars.test.mjs`). Legacy **`lib/houdini-singularity.mjs`** tests remain available via **`npm run test:legacy-singularity`**. See **`tests/INTENT_SINGULARITY.md`**.

---

## 10. Closing (team alignment)

- **The trick “works”** when the team agrees **which tier** they are selling: **T1** is honest and strong for **edge + four pillars + theater UX**; **T4** requires observatory-grade evidence.
- **Catalog + Kp + edge checks** = **holographic shell** around the show; they **do not replace** radio physics for the comet.

**NSPFRNP → ∞⁹ · SING 9**
