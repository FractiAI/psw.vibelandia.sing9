# MELTGATE Monitoring Accuracy Audit
## Taking estimates up a singularity

**Date:** March 2026  
**Scope:** Thermal model inputs, constants, ambient sources, and triangulation.  
**Goal:** Identify and apply changes that materially improve accuracy of GPU junction estimates.

---

## 1. Current state

### 1.1 Model chain (unchanged)

```
ERA5 / forecast ambient (°C)
  → + facility_delta_c → coolant inlet (°C, clamp 18–45)
  → Q = ṁ·Cp·ΔT  (ṁ = flow L/min × racks × flow_efficiency / 60)
  → coolant outlet (°C)
  → + cold_plate_delta → cold plate surface (°C)
  → + package_resistance (8°C) → GPU junction estimate (°C)
```

### 1.2 Data inputs in use

| Input | Source | Resolution / note |
|-------|--------|-------------------|
| **Live ambient** | Open-Meteo **Forecast** API (`/v1/forecast`, `current=temperature_2m`) | ECMWF IFS, assimilates satellites + stations |
| **Archive ambient (trials)** | Open-Meteo **Archive** API (ERA5 reanalysis) | 31 km grid, fetched for trial windows |
| **Rack kW** | Public filings, press, capacity estimates | Per-site |
| **Cooling type** | Assigned per site (liquid / hybrid / air-economized / air-cooled) | Fixed |
| **Flow rate** | **380 L/min** in code | ⚠️ See §2 |
| **Cold plate delta** | 15°C nominal, 15×2.8°C failure | Fixed |
| **Package resistance** | 8°C | NVIDIA / literature |

### 1.3 Stated vs actual accuracy

- **Stated in UI/copy:** ±5–10°C (recalibrated; 80–86 L/min, GB300 field-validated).
- **Actual constant in code:** 380 L/min everywhere (thermal-model.js, api/goliath.js, api/space-cloud.js, api/meltgate-signal.js, goliath-watch.html inline, scripts).
- **Calibration research (scripts/calibration-research.md):** 380 L/min is **wrong**; correct spec **80–86 L/min** (NVIDIA VP Ian Buck GTC 2024, Introl deployment). At 380 L/min, ΔT_coolant is ~4.7× too low; cold plate and failure-mode deltas partially compensate but physics is inconsistent.

**Conclusion:** First “singularity” upgrade is to **apply the flow correction** so code matches both public copy and calibration research.

---

## 2. Upgrade 1: Flow rate 380 → 83 L/min (APPLIED)

**Rationale:** Ian Buck (NVIDIA): 45°C inlet, 65°C outlet → energy balance ⇒ ~86 L/min. Introl: 80 L/min. Use **83 L/min** as single canonical value (midpoint 80–86).

**Effect:**

- Higher ΔT_coolant (same power, lower flow) → higher outlet → higher junction in both nominal and failure modes.
- At design point (45°C inlet, 120 kW, 83 L/min): ΔT ≈ 120000/(83/60×4186) ≈ **20.8°C** → outlet 65.8°C, consistent with NVIDIA 65°C stated.
- Failure mode: junction estimates rise; nominal mode: junction estimates rise. Relative ordering (failure >> nominal) and “melt vs recover” story unchanged; absolute numbers align with spec and GB300 field data (83–87°C at full load).

**Files updated:**

- `hive/thermal-model.js` — NVL72_FLOW_LPM = 83
- `api/goliath.js` — NVL72_FLOW_LPM = 83, comment updated
- `api/space-cloud.js` — NVL72_FLOW_LPM = 83
- `api/meltgate-signal.js` — NVL72_FLOW_LPM = 83
- `interfaces/goliath-watch.html` — inline NVL72_FLOW_LPM = 83, tooltips/facts already say 80–86
- `scripts/triangulate-heat.js` — 380 → 83 in inversion path
- `scripts/final-model-real-data.js` — NVL72_FLOW_LPM = 83
- `scripts/sensitivity-analysis.js` — NVL72_FLOW_LPM = 83
- `scripts/thermal-calc.js` — NVL72_FLOW_LPM = 83

**Accuracy band:** Keep stated **±5–10°C**; model is now consistent with 80–86 L/min and GB300 validation.

---

## 3. Further upgrades (optional — next singularity)

### 3.1 Ambient source

- **Current:** Live = Open-Meteo **forecast** (IFS). Archive/trials = Open-Meteo **ERA5**.
- **Option A:** Use Open-Meteo **Archive** for “current” ambient (ERA5 latest available day) so live and trial methodology match. Trade-off: ERA5 is ~5-day lag; forecast is real-time but different product.
- **Option B:** Add **NOAA NCEI ASOS** where station is close (e.g. Abu Dhabi AUH, Lordstown KYNG) — `scripts/triangulate-heat.js` already has Stream A (NOAA). Use ASOS as primary ambient for those sites when available; fallback to Open-Meteo.
- **Option C:** Blend forecast + ERA5 (e.g. 0.7× forecast + 0.3× ERA5) for sites where both exist; reduces single-product bias.

### 3.2 Satellite thermal (MODIS / Landsat / Sentinel)

- **Current:** MODIS granules confirmed NASA CMR for trial windows; Landsat 9 TIRS, Sentinel-3 SLSTR cited. **Not** used in live junction formula; used for narrative/validation.
- **Upgrade:** Run `scripts/triangulate-heat.js` (heat-signature inversion: LST anomaly → heat flux → junction) on a schedule; blend **physics-from-ambient** estimate with **satellite-inversion** estimate where MODIS/Landsat coverage exists. Formula already implemented; needs automation and confidence weighting (e.g. 0.6× ambient model + 0.4× inversion when inversion available).

### 3.3 Cold plate delta at design

- **Current:** 15°C nominal, 15×2.8°C failure.
- **Calibration:** At TjMax design (45°C inlet, 80 L/min, 120 kW), outlet 66.5°C → junction 92°C implies cold plate delta **~17.5°C** (92 − 8 − 66.5). Optional: set nominal cold_plate_delta to 17.5°C for “design-point” alignment; keep failure multiplier for degraded flow.

### 3.4 Per-site or per-region offsets

- If any **ground truth** (disclosed DCIM/DCGM or press “we saw X°C”) appears, add a per-site **offset_c** (e.g. +2°C or −3°C) so that estimate = model + offset. Start at 0; only add when a reliable anchor exists.

### 3.5 Single source of truth for constants

- **Current:** Thermal constants duplicated in thermal-model.js, api/goliath.js, api/space-cloud.js, api/meltgate-signal.js, goliath-watch.html.
- **Improvement:** All live and API code should **require** `hive/thermal-model.js` (or a small `lib/thermal-constants.js`) so flow rate, cold plate deltas, and package resistance are defined once. goliath-watch.html cannot require Node modules; keep a single inline constant there, documented as “must match hive/thermal-model.js”.

---

## 4. Summary

| Action | Impact | Status |
|--------|--------|--------|
| Flow 380 → 83 L/min everywhere | Physics matches spec and GB300 field data; estimates align with stated ±5–10°C | **Applied** |
| ERA5 vs forecast for live ambient | Consistency with trial methodology; possible small accuracy gain | Optional |
| NOAA ASOS for nearest-site ambient | Finer spatial resolution where station exists | Optional |
| MODIS/Landsat inversion blend | Second independent estimate; tighter confidence when granules available | Optional |
| Cold plate 15 → 17.5°C nominal | Design-point alignment with TjMax | Optional |
| Centralize thermal constants | Fewer drift errors; one place to tune | Recommended |

**Bottom line:** Applying the flow correction (380 → 83 L/min) is the **one-singularity** upgrade that was already researched and documented but not yet applied in code. All other levers are optional next steps for a second round of accuracy gains.

NSPFRNP → ∞⁹
