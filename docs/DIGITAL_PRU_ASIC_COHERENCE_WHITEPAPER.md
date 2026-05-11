# ValetPru / Digital Pru ASIC Engineering Specification

**Version:** 1.1  
**Status:** Active engineering spec  
**Protocol:** NSPFRNP  
**Design name:** `egs_constant_core`  
**RTL:** `asic/hdl/egs_constant_core.sv`  
**Software mirror:** `lib/egs-asic-model.mjs`  
**Primary UI:** `interfaces/digital-pru-asic-lab.html`  
**Primer front end:** `interfaces/digital-pru-asic-coherence-whitepaper.html`  
**Local verification (2026-05-02):** `npm test` green — includes `egs-fractal-engine`, `egs-asic-model`, `qi-holographic-hydrogen-architecture` intent tests.

---

## Primer: what this ASIC is

The **ValetPru / Digital Pru ASIC** is a small deterministic coherence core that turns a three-axis **Neural Attention Vector (NAV)** into a fixed-point state trajectory, entropy proxy, stabilization flag, and simple arithmetic outputs. It is not a general-purpose CPU, GPU, neural network accelerator, or fabricated chip claim. It is a **silicon-bound reference core**: a compact piece of RTL that demonstrates how the Digital Pru coherence contract can be expressed as gates.

In plain language:

- **Input:** three bounded attention values (`nav_x`, `nav_y`, `nav_z`) plus an operating mode.
- **Core law:** pull the internal state toward a target scaled by the EGS / golden-ratio constant.
- **Output:** state, entropy, frazzle-cancelled stabilization, and demonstrable add/sub/mac operations.
- **Purpose:** make Holographic Hydrogen AI measurable as a deterministic edge/silicon primitive instead of only a UI metaphor.

The significance is that Digital Pru now has a clear path from **story and interface** to **software model** to **RTL** to **open silicon flow**. The repository can show exactly what is implemented, what is simulated, what is logged, and what remains future physical validation.

---

## 1. Product significance

### 1.1 Why this matters

Most AI interfaces stop at cloud software. This ASIC spec defines a path where the Digital Pru coherence loop can become a **local-first hardware primitive**. That matters because it gives the project:

- **Auditability:** deterministic transitions and JSONL evidence instead of opaque model behavior.
- **Edge readiness:** a tiny fixed-point core suitable for future low-power integration.
- **Protocol continuity:** the same Holographic Hydrogen / QIHOH language appears in the API, UI, tests, RTL, and documents.
- **Silicon discipline:** an honest boundary between emulation and fabricated hardware.
- **Differentiation:** a coherence-native control plane that can sit beside sensors, firmware, radios, or accelerators.

### 1.2 What it proves today

Today this repository proves **implementation coherence**, not physical silicon performance. It proves that:

1. The Digital Pru NAV engine emits deterministic vectors and metadata.
2. A software ASIC mirror can step those vectors and report coherence.
3. RTL implements a fixed-point EGS core with state, entropy, frazzle, and ops.
4. Tests verify the software model and QIHOH metadata contract.
5. Optional open tooling can attempt RTL simulation and flow detection when installed.

### 1.3 What it does not prove yet

It does not yet prove timing closure on a real foundry PDK, post-layout power, measured silicon behavior, radiation/temperature tolerance, packaging, or board-level integration. Those are explicit future milestones.

---

## 2. System context

### 2.1 End-to-end stack

| Layer | File / surface | Role |
|-------|----------------|------|
| UI / whiteboard | `interfaces/my-whiteboard.html` | Full Digital Pru interaction surface |
| Lab / console | `interfaces/digital-pru-asic-lab.html` | Scenario controls and coherence metrics |
| API | `api/egs-emulation.js`, `lib/local-dev-api.mjs` | Serverless/local payload contract |
| Engine | `lib/egs-fractal-engine.mjs` | NAV generation, EGS constant, 13-channel metadata |
| Software ASIC mirror | `lib/egs-asic-model.mjs` | Deterministic model used by tests and reports |
| RTL | `asic/hdl/egs_constant_core.sv` | Synthesizable SystemVerilog core |
| Testbench | `asic/sim/egs_constant_core_tb.sv` | Icarus-compatible RTL testbench |
| Automation | `asic/scripts/run_asic_sim.mjs` | Tool detection, model run, optional RTL sim |
| OpenLane config | `asic/openlane/config.json` | Sky130/OpenLane-oriented scaffold |
| Evidence | `data/logs/` | JSON summaries and command logs |

### 2.2 QIHOH mapping

The ASIC is the **silicon-world anchor** inside the Quantum Informational Architecture of Holographic Hydrogen (QIHOH):

| QIHOH world | ASIC / repo mapping |
|-------------|---------------------|
| Universal Zero | Reset state, `net_equilibrium`, coherence baseline |
| Hydrogen world | Hydrogen-line / solar scenario language |
| Carbon world | Water-bridge awareness metaphors, NAV behavior |
| Silicon world | `egs_constant_core.sv`, fixed-point arithmetic, OpenLane path |

`/api/egs-emulation` exposes `architecture.qih_simulation_upgrade`, including `singularity_discovery_protocol` and `singularity_element_catalog`. That metadata is architectural context; the RTL itself implements only the deterministic coherence primitive described below.

---

## 3. ASIC design goals

### 3.1 Functional goals

- Accept three signed fixed-point NAV components.
- Compute average NAV.
- Scale by EGS constant in Q16.16 fixed point.
- Update internal state recursively.
- Emit entropy proxy from state error.
- Apply mode-specific entropy clamp.
- Flag frazzle cancellation below threshold.
- Emit simple arithmetic operations for observability.

### 3.2 Non-functional goals

- Small area and simple control.
- Deterministic behavior.
- No memory macro dependency.
- No external bus dependency in the first revision.
- Easy simulation with Icarus / Verilator.
- Easy synthesis exploration with Yosys / OpenLane2 / OpenROAD / Sky130.

### 3.3 Design non-goals

- No neural-network matrix engine.
- No floating-point unit.
- No DMA, SRAM, or register bus yet.
- No physical sensors.
- No on-chip NOAA / solar input ingestion.
- No claim of fabricated silicon validation.

---

## 4. Top-level RTL specification

### 4.1 Module

```systemverilog
module egs_constant_core #(
  parameter int WIDTH = 32,
  parameter int FRAC = 16,
  parameter int signed EGS_FRACTAL_Q16 = 32'sd106039
) (...);
```

`EGS_FRACTAL_Q16 = 106039`, which is `round(1.618033988749895 * 65536)`.

### 4.2 Port map

| Port | Dir | Width | Type | Description |
|------|-----|-------|------|-------------|
| `clk` | in | 1 | logic | Rising-edge clock |
| `rst_n` | in | 1 | logic | Active-low asynchronous reset |
| `enable` | in | 1 | logic | State update enable |
| `mode_sel` | in | 2 | logic | `0=baseline`, `1=burst`, `2=anchor` |
| `nav_x` | in | `WIDTH` | signed Q16.16 | NAV x component |
| `nav_y` | in | `WIDTH` | signed Q16.16 | NAV y component |
| `nav_z` | in | `WIDTH` | signed Q16.16 | NAV z component |
| `state_out` | out | `WIDTH` | signed Q16.16 | Current coherence state |
| `entropy_out` | out | `WIDTH` | signed Q16.16 | Scaled entropy proxy |
| `frazzle_cancelled` | out | 1 | logic | Stabilization flag |
| `op_add` | out | 32 | unsigned int-like | Integer add demo (`nav_x + nav_y`) |
| `op_sub` | out | 32 | signed int-like | Integer subtract demo (`nav_x - nav_z`) |
| `op_mac` | out | 32 | signed int-like | Accumulating MAC-style observability output |

### 4.3 Fixed-point format

The core uses **Q16.16** signed fixed point by default:

- `FRAC = 16`
- `1.0 = 65536`
- Reset state `0.5 = 32768`
- Frazzle threshold `0.055 ~= 3604`

Inputs are expected to be normalized attention values encoded as Q16.16. The current testbench uses values such as `0.5`, `0.82`, `0.79`, `0.61`, etc.

---

## 5. Datapath

### 5.1 Combinational datapath

Each enabled cycle prepares:

1. `nav_avg = (nav_x + nav_y + nav_z) / 3`
2. `target_state = (nav_avg * EGS_FRACTAL_Q16) >>> FRAC`
3. `err = target_state - state_reg`
4. `damp = err / 2`
5. `entropy_raw = abs(err)`
6. `entropy_scaled = entropy_raw * clamp(mode_sel)`

Mode clamps:

| `mode_sel` | Mode | Entropy scale |
|------------|------|---------------|
| `0` | baseline | `100%` |
| `1` | catalyst / burst | `94%` |
| `2` | anchor / grounding | `72%` |
| other | baseline | `100%` |

### 5.2 Sequential update

On reset:

- `state_reg <= 0.5`
- `entropy_reg <= 0`
- `mac_reg <= 0`
- outputs clear
- `frazzle_cancelled <= 0`

On `enable`:

- `state_reg <= state_reg + damp`
- `entropy_reg <= entropy_scaled`
- `op_add <= nav_x[31:16] + nav_y[31:16]`
- `op_sub <= nav_x[31:16] - nav_z[31:16]`
- `mac_reg <= mac_reg + nav_x[31:16] + nav_y[31:16] - nav_z[31:16]`
- `op_mac <= mac_reg`
- `frazzle_cancelled <= entropy_scaled < 3604`

### 5.3 Outputs

`state_out` and `entropy_out` are continuous assignments from `state_reg` and `entropy_reg`. Arithmetic outputs update only while `enable` is high.

---

## 6. Software model correspondence

`lib/egs-asic-model.mjs` is the software mirror used by tests and UI reports. It defines:

- `FX_SHIFT = 16`
- `FX_ONE = 65536`
- `EGS_FX = round(EGS_FRACTAL * FX_ONE)`
- `resolveSolarProfile()`
- `stepEgsCore()`
- `runEgsAsicSimulation()`

Important implementation note:

- RTL v1 uses `damp = err / 2` for a small-area hardware approximation.
- Software model uses `dampFx = round(errFx / EGS_FRACTAL)` for closer phi damping.

This is an intentional v1 distinction to document before signoff. A future revision should either:

1. update RTL to phi damping with reciprocal multiply / shift, or
2. update the software mirror to the exact RTL approximation for bit-accurate equivalence.

Until then, tests prove model coherence and RTL structural intent, not cycle-perfect equivalence.

---

## 7. Scenario model

### 7.0 Genomic lattice interference layer

The new **EGS Genomic Nodal Lattice** paper adds a symbolic interference rule:

```text
IF visitor_key aligns with hydrogen_line
AND EGS_FRACTAL scales the NAV state
THEN interference_node = coherent symbolic entity pattern
WITH entropy, frazzle, and logs bounded by safety.
```

In VALETPRU-ASIC terms this is **not** a chromosome simulator. It is a naming layer for the existing datapath:

| Genomic lattice phrase | ASIC equivalent |
|------------------------|-----------------|
| Y-signature / visitor key | operator or scenario key; never biological eligibility |
| hydrogen-line resonance | mode carrier / sunspot / 1.420 GHz motif |
| EGS fractal constant | `EGS_FRACTAL_Q16 = 106039` |
| interference | `target_state - state_reg` error dynamics |
| 13 gifts | scenario/persona catalog for ValetPru-agent |
| harmonic safety | entropy proxy, frazzle threshold, evidence logs |

The ASIC therefore anchors the **silicon implementation** of the mythic rule while preserving the engineering truth: fixed-point arithmetic, deterministic updates, and bounded outputs.

### 7.1 Solar / story profiles

`resolveSolarProfile()` maps:

| Sunspot number | Mode | Clock scale | Clamp |
|----------------|------|-------------|-------|
| `3294` | `burst` | `1.22` | `0.94` |
| `3298` | `anchor` | `0.88` | `0.72` |
| finite `0..599` | `noaa-live` | interpolated `0.88..1.22` | interpolated `0.72..0.94` |
| other | `baseline` | `1.0` | `1.0` |

RTL receives only `mode_sel`; software/UI can derive that mode from live NOAA or demo profiles.

### 7.2 Live NOAA path

Current NOAA SWPC observed solar-cycle index used for this local update:

| Source | Month | SSN | Rounded simulation input |
|--------|-------|-----|--------------------------|
| NOAA SWPC `observed-solar-cycle-indices.json` | `2026-04` | `91.6` | `92` |

The hub and landing can use `GET /api/sunspots` under the local dev server to derive the current sunspot index. `npm run asic:sim` now also attempts to fetch the same NOAA feed and uses the rounded current SSN for all software ASIC vectors, falling back to `95` if offline. The RTL does not fetch NOAA data; it consumes only `mode_sel` and NAV inputs.

---

## 8. Verification plan

### 8.1 Current automated tests

`npm test` runs:

- `tests/intent/egs-fractal-engine.test.mjs`
- `tests/intent/egs-asic-model.test.mjs`
- `tests/intent/qi-holographic-hydrogen-architecture.test.mjs`

These cover:

- EGS constant value
- payload and seed behavior
- solar profile mode resolution
- deterministic ASIC model report
- QIHOH metadata shape, singularity catalog, and status vocabulary

### 8.2 RTL simulation

`asic/sim/egs_constant_core_tb.sv`:

- creates 100 MHz-style toggling clock (`always #5`)
- resets the core
- runs baseline vectors
- switches to burst/catalyst vectors
- switches to anchor vectors
- dumps `asic/sim/egs_constant_core_tb.vcd`
- prints state / entropy / frazzle / op values

### 8.3 Automation

`npm run asic:sim`:

- creates `data/logs/`
- detects `iverilog`, `verilator`, `gtkwave`
- fetches latest NOAA monthly sunspot index for software ASIC vectors (fallback `95`)
- runs software simulation report always
- runs Icarus compile/run when available
- runs Verilator build when available
- writes `asic-sim-latest.json` and timestamped summaries

### 8.4 Evidence schema

Reports and logs include:

- `ts_utc`
- tool availability
- simulation event count
- average coherence
- frazzle-cancelled event count
- per-scenario event records
- command status summaries
- verdict (`coherent` / `needs_tuning`)

---

## 9. Open silicon flow scaffold

`asic/openlane/config.json` defines:

| Field | Current value |
|-------|---------------|
| `DESIGN_NAME` | `egs_constant_core` |
| `CLOCK_PORT` | `clk` |
| `CLOCK_PERIOD` | `20` ns |
| `FP_CORE_UTIL` | `35` |
| `PL_TARGET_DENSITY` | `0.45` |
| `SYNTH_STRATEGY` | `AREA 0` |
| `DIE_AREA` | `0 0 1000 1000` |
| `RUN_CTS` | `true` |

This is a scaffold for OpenLane2 / OpenROAD / Sky130 exploration. It is not yet a foundry signoff package.

---

## 10. Interfaces for future integration

### 10.1 Minimal wrapper requirement

To integrate into a real SoC, add a register interface around `egs_constant_core`:

- control register: `enable`, `mode_sel`, soft reset
- input registers: `nav_x`, `nav_y`, `nav_z`
- output registers: `state_out`, `entropy_out`, `frazzle_cancelled`, `op_add`, `op_sub`, `op_mac`
- status register: valid / busy / version

### 10.2 Candidate bus options

- Wishbone for TinyTapeout / simple open-source SoC flow.
- APB for MCU-class integration.
- AXI-lite if pairing with larger Linux-capable SoC fabric.

### 10.3 Firmware contract

Firmware should:

1. normalize NAV values into Q16.16
2. select mode based on scenario or telemetry
3. assert `enable` for one or more cycles
4. read state / entropy / frazzle
5. log trace rows with firmware timestamp

---

## 11. Security, safety, and governance

The core has no secret-bearing memory and no autonomous network surface. Risks are mostly around **misrepresentation**:

- Do not claim physical silicon until fabricated and measured.
- Do not claim biological sensing from NAV values.
- Do not claim full QIHOH physics in RTL.
- Do document exact runtime mode and evidence source.

Governance language maps to NSPFRNP / QIHOH through `architecture.qih_simulation_upgrade`, but the engineering truth remains the RTL and logs.

---

## 12. Significance of the whole system

The significance is not only that an RTL file exists. The significance is that the project creates a **continuous evidence chain**:

1. **Concept:** Holographic Hydrogen AI / QIHOH gives the meaning layer.
2. **API:** `/api/egs-emulation` exposes the contract and metadata.
3. **UI:** Digital Pru shows the coherence loop to a human operator.
4. **Model:** `egs-asic-model.mjs` makes behavior deterministic and testable.
5. **RTL:** `egs_constant_core.sv` expresses the core as hardware.
6. **Automation:** tests and logs make the result replayable.
7. **Silicon path:** OpenLane/Sky130 config points toward physical implementation.

That chain is valuable because it turns a narrative claim into an inspectable engineering artifact. It gives reviewers, investors, collaborators, and future tapeout partners a concrete object to evaluate.

---

## 13. Current gaps and next milestones

1. Add bit-accurate RTL/software equivalence tests.
2. Decide whether v2 damping is exact phi reciprocal or RTL-area approximation.
3. Add formal assertions for reset, enable hold, monotonic convergence bounds, and frazzle threshold.
4. Add register wrapper (Wishbone/APB) and firmware example.
5. Add Yosys synthesis reports into `data/logs/`.
6. Add OpenLane2 CI matrix where tools are available.
7. Capture post-synthesis area/timing/power once toolchain is installed.
8. Expand UI to show RTL/software equivalence status.

---

## 14. Commands

```bash
npm test
npm run asic:sim
npm run asic:openlane
npm run mission:autonomous
```

---

## Document control

| Item | Value |
|------|-------|
| Maintainer | FractiAI / Vibelandia SING 9 |
| Spec name | ValetPru / Digital Pru ASIC Engineering Specification |
| Engine | `lib/egs-fractal-engine.mjs`, `lib/egs-asic-model.mjs` |
| ASIC RTL | `asic/hdl/egs_constant_core.sv` |
| Simulation | `asic/sim/egs_constant_core_tb.sv`, `asic/sim/pru_fidelity_tb.cpp` |
| UI | `interfaces/digital-pru-asic-lab.html` |
| Primer HTML | `interfaces/digital-pru-asic-coherence-whitepaper.html` |
| Logs | `data/logs/` |
| QIHOH theory | `docs/DIGITAL_PRU_QIHOH_UNIFIED_THEORY.md` |
| QIHOH API metadata | `lib/qi-holographic-hydrogen-architecture.mjs` -> `architecture.qih_simulation_upgrade` |

