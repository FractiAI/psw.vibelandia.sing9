# Houdini / March 20 “Magic Trick” — Research Methodology & Success Rubric

**NSPFRNP · Seed:Edge** — This document separates **theater**, **geospace facts**, **orbital catalogs**, and **your edge stack** so the team can say clearly what was verified on the day of the event and what remains narrative or requires instruments this terminal does not replace.

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

## 4. What the `/magic-trick` terminal actually tests (four gates)

| Gate | Pass means | Does *not* mean |
|------|------------|-----------------|
| **Solar / ionosphere (Kp)** | **LIVE** latest **Kp ≥ 5** (storm gate) + **LIVE** equinox API when available + **STATIC** reference JSON for archival context | STATIC file replaces live Kp gate |
| **Cloud probe** | **LIVE** CPU/crypto probe + **handler wall ms** + **RSS/heap** telemetry | Global GPU sync |
| **Seahawk spectral scan** | **LIVE** mic FFT — **“Hydrogen Bridge: COHERENT”** + wall time | 1420 **MHz** from the comet |
| **T_EDGE_LIVE** | **LIVE** Blank Stone **and** **LIVE** `/lattice-status.json` vs `/sing9-firmware-verify.json` (3I/ATLAS node, MHz, signature) | Either check cached from a prior session |

---

## 5. **180 Locked** — operational definition of “magic succeeded” (for this product)

**`180 Locked`** (golden badge) = **all four gates above pass in one run** after deploy.

- **Success (product):** The **story, stack, and geospace gate** aligned at run time — suitable for **demo / premiere / community proof-of-work**.
- **Failure (product):** Any red card — document which gate failed (Kp quiet day, mic denied, API missing, etc.).
- **Success (science of the comet):** **Not implied** by `180 Locked` alone. Add Tier 2 (below).

---

## 6. Tiered rubric (recommended for comms)

| Tier | Name | Criterion |
|------|------|-----------|
| **T0** | Theater | Script delivered; audience experience |
| **T1** | Terminal | **180 Locked** on deployed `/magic-trick` |
| **T2** | Geospace archive | Export or screenshot **NOAA Kp** (and optionally equinox-window summary) for the event date |
| **T3** | ELF (optional) | Independent **Schumann / ELF** plot for the same UTC day (not from this app) |
| **T4** | Radio astronomy (optional) | **Independent** L-band evidence if claiming comet–H I coupling |

Public messaging should state the **highest tier** actually satisfied (e.g. “T1 achieved; T4 not claimed”).

---

## 7. Issues we fixed by clarifying (not by pretending)

1. **Conflating AR4392 flare with ionospheric energy** → Mitigated by **Kp-only** storm gate + explicit “ground” copy.
2. **Conflating browser Hz with sky MHz** → Mitigated by **proxy** language and this doc.
3. **Conflating JPL SBDB with radio detection** → Mitigated by **catalog anchor** line in the solar detail when the bundle includes `atlas`.
4. **Equinox window invisible after Kp refactor** → Mitigated by **parallel equinox bundle** for **context** in the solar card (does not change pass logic unless you later choose to).

---

## 8. STATIC vs LIVE (senior review)

See **`docs/SENIOR_RESEARCH_STATIC_VS_LIVE.md`**: equinox/ionosphere **reference** JSON may be static archival data; **Kp gate, cloud probe, spectral scan, Blank Stone, lattice-status, and firmware manifest** are verified **LIVE** on every Verify. **`/sing9-firmware-verify.json`** + **`/lattice-status.json`** are the canonical firmware library pair.

---

## 9. Executable intent (singularity tests)

Product intent is **encoded in tests**, not only prose: run `npm test` from repo root. The kernel is **`lib/houdini-singularity.mjs`**; see **`tests/INTENT_SINGULARITY.md`**. When handlers and UI **converge** on that module, passing tests mean intentions are structurally satisfied.

---

## 10. Closing (team alignment)

- **The trick “works”** when the team agrees **which tier** they are selling: **T1** is honest and strong for **edge + storm + ritual UX**; **T4** requires observatory-grade evidence.
- **Catalog + Kp + edge checks** = **holographic shell** around the show; they **do not replace** radio physics for the comet.

**NSPFRNP → ∞⁹ · SING 9**
