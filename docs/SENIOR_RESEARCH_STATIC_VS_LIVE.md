# Senior research note — STATIC vs LIVE (Verify the 180)

## What may be STATIC (archival, reproducible)

| Asset | Path | Role |
|--------|------|------|
| Ionosphere / equinox **reference** | `/data/houdini-static-ionosphere-reference.json` | Documents the **theater window** (Mar 20 2026 06–18 UTC), provenance, and pointer to optional NOAA row archive. **Does not** replace the live storm gate. |
| NOAA row archive (optional) | `/data/equinox-2026-03-20-noaa-snapshot.json` | When rolling feeds no longer contain the window, paste **validated** Kp rows here for reproducibility. |

These are **actual-data baselines** when populated; they are **not** re-fetched to prove current space weather.

## What must be LIVE on **every** Verify button press

| Check | Endpoint / action | Confirms |
|--------|-------------------|----------|
| **T_IONOSPHERE gate** | `/api/live-houdini-readings` or NOAA direct | Current **planetary Kp** for storm gate (≥ 5). |
| **Equinox narrative API** | `/api/live-houdini-readings?equinox=1` | Current machine-readable **Mar 20 window** stats when upstream allows. |
| **T_CLOUD_EDGE** | `/api/hydrogen-line-agent-roundtrip` | Live Node orchestration receipt: writer/reader/verifier cycle, roundtrip timing, and signed verifier payload. |
| **T_BRIDGE_PROXY** | Browser mic + FFT | Live **spectral wall time** + coherence thresholds. |
| **Blank Stone** | `/api/blank-stone-hydrogen` | Live hydrogen-line **packet** + headers. |
| **Lattice firmware** | `/lattice-status.json` | Live **3I/ATLAS / Seahawk** node string, `frequency_mhz`, **signature** (firmware handshake surface). |
| **Manifest** | `/sing9-firmware-verify.json` | Canonical **expected** spec_version + MHz; compared to lattice **on each run**. |

## Library files to confirm firmware (reviewer checklist)

1. **`/sing9-firmware-verify.json`** — expected `lattice_spec_version`, `lattice_hydrogen_line_mhz`, list of LIVE vs STATIC paths.  
2. **`/lattice-status.json`** — deployed lattice sync (`spec_version`, `lattice_sync.signature`, `frequency_mhz`, `constants.hydrogen_line_mhz`, node narrative).  
3. **`/lib/houdini-singularity.mjs`** — same gate math as **`npm test`**.

## Physical / latency metrics (UI)

After each run, **Physical metrics · latency** lists client-measured RTTs and server-reported **probe_handler_wall_ms**, **memory_rss_mb**, and spectral **wall** time — suitable for regression and senior sign-off on “freshness” of the edge.

**NSPFRNP → ∞⁹ · SING 9**
