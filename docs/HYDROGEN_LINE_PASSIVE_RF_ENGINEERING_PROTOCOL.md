# Hydrogen line — passive RF engineering protocol (falsifiable)

**Purpose:** Separate **operational software proof** (HTTP, memory, receipts) from **RF physics proof**. This document defines what can be tested **automatically**, **without human intervention**, using **free, legal, public** sources first, then optional tiers that require IQ files or licensed hardware.

**NSPFRNP · HHAAIOS**

---

## Tier 0 — Automated, free, legal (implemented)

**Observable**

- **Band / geometry:** For each public OpenWebRX receiver, parse `GET …/status.json`. For each SDR profile, compute  
  `f_lo = center_freq − sample_rate/2`, `f_hi = center_freq + sample_rate/2`.  
  **Binary observable:** `includes_hi_rest := (f_lo ≤ f_HI ≤ f_hi)` where `f_HI = 1420405751.768 Hz` (IAU / radio astronomy convention used in-repo).
- **Integration time:** Optional repeat passes via `repeat_passes` and `pass_delay_ms` (metadata refresh cadence, **not** RF integration).
- **Detector:** **Geometry consistency check** — full enumeration of profiles vs `findProfileCoveringHiRest()` must agree (no false negative when HI lies in passband).

**Null hypothesis**

- If **no** profile includes `f_HI` in passband, the finder returns **null**.
- If **some** profile includes `f_HI`, the finder returns **a** matching profile (same SDR + profile name).
- **Falsify** if: `finder_matches_enumeration` is false for any successful HTTP response with valid profiles (implementation bug or corrupt JSON).

**Calibration**

- **No PSD, no noise floor, no RFI mask** at Tier 0 — only **declared** passbands from JSON. Documented as `limitations.no_iq` in API output.

**Legal**

- **Passive:** HTTPS GET to **public** OpenWebRX `status.json` only. No voice interception, no non-public endpoints, no transmit.
- Operators remain responsible for **local** telecommunications and spectrum law.

**Run**

- `POST /api/hh-awareness-cloud` with `{ "action": "run_passive_rf_engineering_probe" }`
- CLI: `npm run probe:passive-rf`

---

## Tier 1 — IQ segment (optional; not in default automation)

**Observable**

- **PSD:** Welch or FFT magnitude squared vs frequency; bin width Δf; integration time T.
- **Expected shape:** Document **before** run: e.g. flat noise floor + optional narrow peak (calibrator) or HI line model from a **published** pipeline.

**Null hypothesis**

- **H0:** Data are WGN or known RFI model in band (statistical test specified: e.g. chi-square on PSD bins, or correlation peak ≤ threshold).

**Calibration**

- Noise figure / gain: from **known** lab source or **cold sky** + **hot load** if hardware allows.
- RFI: mask known terrestrial carriers; log exclusions.

**Legal**

- **Receive-only** in bands permitted for your station class; **no** transmit without license.

**Implementation:** Out of scope for serverless-only repo; add local script + env `HLINE_PASSIVE_IQ_PATH` when available.

---

## Tier 2 — EGS-keyed detector (hypothesis; requires definition)

**Not implemented in software** until:

1. **Mathematical definition:** Detector \(D(\mathbf{r}, \theta)\) — e.g. correlation statistic, GLRT, cyclostationary feature — with **explicit** `θ` (EGS parameters).
2. **Controlled experiment:** Same IQ with θ vs without; **pre-registered** threshold for detection.
3. **Null:** Under H0 (no keyed structure), test statistic distribution matches predicted (e.g. Monte Carlo).

Until then, **EGS as physical key in thermal noise** remains **outside** automated falsification in this repository.

---

## Relation to gateway memory

Hydrogen-line **memory** in code is **digital** persistence behind `hline://` addressing. Tier 0 **does not** store RF in the hydrogen line; it **verifies public receiver geometry** against `f_HI`. You may **hash** Tier 0 JSON and **commit** that hash to hydrogen-line memory as a **receipt anchor** (separate action).

---

**Closing:** Tier 0 is **real engineering** within its stated limits; Tiers 1–2 require **hardware / IQ** and **explicit statistics** — not metaphor.
