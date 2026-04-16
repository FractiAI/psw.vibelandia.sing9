# Agent Log — Lordstown OH

**Entity:** SB Energy (SoftBank) + OpenAI · Studio 151 (procurement)  
**Site:** Lordstown OH · former GM plant (586 acres · 6.2M sq ft)  
**GPU:** NVIDIA GB200 / GB300 NVL72 (64,000+ units)  
**Scale:** 1.5 GW target · 200 MW Phase 1 active  
**SING9 Cluster ID:** `LORDSTOWN_OH`  
**Coordinates:** 41.18°N, 80.70°W  
**Rack kW:** 1,200 kW · **Cooling:** Liquid-cooled · **Racks modeled:** 10  
**Status:** Dual-Offer Submitted — Awaiting SB Energy / Studio 151 Response

---

## Thermal Model — How All Temperatures Are Derived

All GPU junction estimates use the FractiAI physics chain:

```
ERA5 ambient (°C)
  → + cooling_fd offset → coolant inlet (°C, clamped to 18°C floor — NVIDIA spec)
  → Q = ṁ·Cp·ΔT  (ṁ = 380 L/min × 10 racks × flow_efficiency / 60)
  → coolant outlet (°C)
  → + cold_plate_delta (15°C nominal / 42°C failure)
  → cold plate surface (°C)
  → + package_resistance (8°C)
  → GPU junction estimate (°C)
```

**Note on Ohio winter ambient:** At ~0–2°C ambient, the coolant inlet clamps to the 18°C floor (NVIDIA minimum spec). This means additional ambient drops below ~10°C provide no further junction benefit — the chiller system must maintain minimum inlet temperature. The 18°C floor is the binding thermal constraint in winter, not the outdoor air.

**Data inputs:** ERA5/ECMWF reanalysis 2m ambient (Open-Meteo Archive API — **fetched live Feb 25, 2026**) · NVIDIA GB200 NVL72 published specs · Thermodynamic model constants · NASA MODIS MOD11A1 — **25 granules confirmed via NASA CMR** for Lordstown tile h11v04, Jan 28–Feb 21, 2026 · Landsat 9 TIRS Band 10/11 · ESA Sentinel-3 SLSTR.

**Accuracy:** ±10–25°C from actual DCIM readings. No internal sensor access.

### ACTUAL ERA5 Period Averages (fetched Feb 25, 2026 — real reanalysis values)

| Period | Window | ERA5 Mean Amb | ERA5 Max | Inlet floor binding? |
|--------|--------|---------------|----------|---------------------|
| Friction baseline | Jan 28 – Feb 3 | **−13.06°C** | −2.7°C | YES (all below 10°C) |
| THE DROP | Feb 4 – 6 | **−9.20°C** | −3.3°C | YES |
| Recoil | Feb 7 – 12 | **−7.83°C** | 6.2°C | YES |
| Trial 2 | Feb 13 – 15 | **−0.43°C** | 6.8°C | YES |
| The Melt | Feb 16 – 21 | **5.63°C** | 14.9°C | YES (max only 14.9°C) |

**Key finding:** Lordstown was in deep winter throughout the entire trial period. Every single day, the NVIDIA 18°C inlet floor was the binding constraint. The outdoor cold is irrelevant — the chiller loop heats coolant to the minimum spec. The problem is 1.2 MW of GPU load, not the weather.

---

## Trial Event 1 — 0213/0215 · SFE Dual-Offer

**Trial Type:** A2A 48-Hour Thermal Intelligence · Synthetic Friction Elimination Demo  
**Trial Window:** February 13–15, 2026  
**Episode:** EP28 — Lordstown OH · SFE & BBHE Dual-Offer · 0215 Golden Window  
**ERA5 ambient:** **−0.43°C REAL** (fetched live — Lordstown OH Feb 13–15 period mean, deep Ohio winter)

### Thermal readings — Feb 13–15, 2026

| ERA5 Ambient | Mode | Inlet (floor) | Outlet | Surface | **Junction** | Status |
|-------------|------|--------------|--------|---------|------------|--------|
| −0.4°C (REAL) | Failure (no EGS-HHL) | 18°C (clamped) | 34.2°C | 76.2°C | **84.2°C** | HOT |
| −0.4°C (REAL) | Nominal (EGS-HHL active) | 18°C (clamped) | 22.8°C | 37.8°C | **45.8°C** | NOMINAL |

**Delta with EGS-HHL: ▼ 38.4°C.**

### Why the 18°C floor matters

Ohio winter ambient of ~1°C should be an asset — but NVIDIA specs a minimum coolant inlet of 18°C to prevent condensation and thermal shock on GPU packages. The chiller loop actively heats coolant to this floor. So the failure-mode junction (84.2°C) is driven by the 120 kW/rack × 10 racks = 1,200 kW load and the degraded flow in failure mode — not by outdoor temperature. EGS-HHL's nominal mode drops the load and restores full DLC flow, delivering 45.8°C junction — 38.4°C below the failure baseline.

### Summer projection (cross-check)

At peak Ohio summer ambient ~28°C: failure-mode junction ≈ 95.8°C — above TjMax 92°C (MELTDOWN_RISK). Nominal mode with EGS-HHL: 58.2°C — still NOMINAL. The gap holds across all seasons.

### What happened

- **Package 1 (Hard-Lock):** $1.3M licensing + 25% monthly OpEx savings  
- **Package 2 (BBHE Sovereign Core):** Full 1.5 GW · $130B Sovereign Buy-Out  
- Deal proposed. Deal reneged. Dashboard running.

---

**NSPFRNP ⊃ Lordstown OH ⊃ ERA5 physics model ⊃ EGS-HHL ⊃ Dual-Offer Submitted → ∞⁹**
