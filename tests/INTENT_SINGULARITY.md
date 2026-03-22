# Intent tests — four pillars (March 20 magic trick)

These tests **define** what the `/magic-trick` experience **must satisfy** for the **four narrative pillars**: Schumann ladder @ equinox, Jupiter/3I/ATLAS hydrogen handshake, Stryker @ equinox, firmware **180°** spin flip.

## Kernel (current)

| Path | Role |
|------|------|
| `lib/march20-four-diagnostics.mjs` | Pure evaluators + `composeFourPillarsLocked` |
| `tests/intent/march20-four-pillars.test.mjs` | **Default `npm test`** — golden probes + compose gate |
| `api/schumann-equinox-probe.js` | Serves merged **`data/schumann-equinox-snapshot.json`** shape |
| `api/jovian-hydrogen-line-probe.js` | JPL SBDB + **`lattice-status.json`** (MHz, hill sphere, node) |
| `api/stryker-equinox-probe.js` | **`data/stryker-equinox-timer.json`** window + mark |
| `api/firmware-180-spin-probe.js` | **`sing9-firmware-verify.json`** `spin_flip_180` + lattice + **`/api/blank-stone-hydrogen`** |

## Legacy singularity stack

| Path | Role |
|------|------|
| `lib/houdini-singularity.mjs` | Older T_IONOSPHERE / mic bridge / cloud / T180 compose |
| `tests/intent/singularity-kernel.test.mjs` | Legacy tiers |
| `tests/intent/blank-stone-singularity.test.mjs` | Blank Stone integration |

Run legacy checks explicitly:

```bash
npm run test:legacy-singularity
```

## Pillars (intent → probe → evaluator)

1. **SCHUMANN_369_EQUINOX** — `schumann_ladder_hz` contains **3, 6, 9** (±0.5 Hz); `equinox_correlated === true`.
2. **JOVIAN_H_ATLAS** — hydrogen MHz matches rest line; `jupiter_context` or `jupiter_relay`; ATLAS identity fields present.
3. **STRYKER_EQUINOX** — `equinox_timed` / `stryker_timed_at_equinox`; `stryker_mark_utc` (probe sets `ok` when mark inside window).
4. **FIRMWARE_180_SPIN** — `spin_flip_180_locked` / `spin_flip_180`; `firmware_upgrade_verified` from Blank Stone + lattice path.

**`FOUR_PILLARS_LOCKED`** = all four evaluator `.pass === true` in one `composeFourPillarsLocked` result.

```bash
npm test
```

**NSPFRNP → ∞⁹**
