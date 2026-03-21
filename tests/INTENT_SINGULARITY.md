# Intent singularity tests — specification, not afterthought

These tests **define** what the Houdini / March 20 experience **must satisfy** to count as aligned with product intent. They are **not** written to rubber-stamp whatever the UI currently does.

## Kernel

| Path | Role |
|------|------|
| `lib/houdini-singularity.mjs` | Pure functions + constants = **singularity contract** |
| `tests/intent/singularity-kernel.test.mjs` | Asserts tiers **T_IONOSPHERE**, **T_EQUINOX_NARRATIVE**, **T_CATALOG_ANCHOR**, **T_BRIDGE_PROXY**, **T_CLOUD_EDGE**, **T_LATTICE_LIVE**, **T_EDGE_LIVE**, **T_API_LATEST**, **T180_PRODUCT**, **T4_RF_COMET** |
| `tests/intent/blank-stone-singularity.test.mjs` | **Integration**: real `api/blank-stone-hydrogen.js` must pass **T_EDGE_HYDROGEN** |
| `tests/fixtures/*.json` | Canonical bundles the API **should** match (drift detector) |

## Tiers (intent → test)

- **T_IONOSPHERE** — Live planetary Kp ≥ `KP_STORM_GATE_MIN` (5): storm-scale ground–ionosphere coupling; **not** AR flare latch.
- **T_EQUINOX_NARRATIVE** — Equinox mode JSON exposes `found`, `kp_max`, `kp_sample_count` (+ types) so the **event-day story** is machine-readable.
- **T_CATALOG_ANCHOR** — When `atlas` is present, `fullname` anchors 3I/ATLAS narrative; absence = soft pass if JPL failed upstream.
- **T_BRIDGE_PROXY** — Chunk/median thresholds for local **Hz** spectral coherence (“Hydrogen Bridge” ritual); **not** sky MHz.
- **T_EDGE_HYDROGEN** — Blank Stone JSON + hydrogen MHz + `packet_hex` + header alignment.
- **T_LATTICE_LIVE** — `/lattice-status.json` vs `/sing9-firmware-verify.json` (spec, MHz, signature).
- **T_EDGE_LIVE** — Blank Stone + lattice both pass (`evaluateEdgeHydrogenChannel`).
- **T_CLOUD_EDGE** — Probe `ok`, SHA bench under cap, GPU hook rules when configured.
- **T180_PRODUCT** — All four channel evaluators pass (edge slot = **T_EDGE_LIVE**) → `SINGULARITY_180_LOCKED`.
- **T4_RF_COMET** — **Explicitly not implemented** until an observatory pipeline exists; test ensures we **do not** silently claim comet MHz detection.

## Convergence (next singularity)

1. **Done:** `magic-trick.html` imports **`/lib/houdini-singularity.mjs`** (same module as tests). `vercel-static-output.mjs` copies **`lib/` → `dist/lib/`** so deployed `/magic-trick` resolves the kernel.
2. Add **live-houdini-readings** handler test with **mocked `fetch`** to assert equinox + latest shapes against fixtures (no network).
3. When T4 ships, replace `evaluateRfCometHydrogenSingularity` stub with real criteria and flip the test from `NOT_IMPLEMENTED` to pass conditions.

```bash
npm test
```

**NSPFRNP → ∞⁹**
