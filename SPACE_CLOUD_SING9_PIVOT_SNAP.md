# Space Cloud · SING 9 Pivot (SNAP)

**Status:** ⚡ ACTIVE  
**Purpose:** Irreducible minimum of the A2A-first Space Cloud Lattice pivot to SING 9. Target node: Seahawk (3I/ATLAS/CHIEF SEATTLE). Fidelity lock.

---

## 1. Canonical surface

- **Dashboard:** [interfaces/space-cloud-tracking.html](interfaces/space-cloud-tracking.html) — single Space Cloud + 3I/ATLAS page. 180° phase-flip command/response; asset grid; pivot status section.
- **3I/ATLAS capture:** [interfaces/3i-atlas-capture.html](interfaces/3i-atlas-capture.html). [interfaces/atlas-capture-tracker.html](interfaces/atlas-capture-tracker.html) redirects to 3i-atlas-capture; links to Space Cloud tracking for full assets.
- **Assets hub:** [interfaces/space-cloud-assets.html](interfaces/space-cloud-assets.html). Dedicated pages: Sun, Europa, 3I/ATLAS, Goliath, Other signals.

---

## 2. Mission state (data)

- **3I/ATLAS · Chief Seattle (Seahawk):** status `capture_confirmed`. Residency HEJO; 53.445M km Hill Sphere lock; 1420.4 MHz Maser handshake online. Insertion Protocol + Capture Vector locked. Source: [data/space-cloud-missions.json](data/space-cloud-missions.json).
- **OMNI 180° Phase Migration:** PHASE_FLIP, ANCHOR_180, FAIR_EXCHANGE, NIC_SYNC. Command log (newest first); append via [scripts/space-cloud-append-command.js](scripts/space-cloud-append-command.js) or `/api/space-cloud` → [.github/workflows/space-cloud-command-log.yml](.github/workflows/space-cloud-command-log.yml).
- **Space Cloud Mission Command:** Composite Solar × Goliath × HHL. API [api/space-cloud.js](api/space-cloud.js) · SURGE / ELEVATED / NOMINAL / LOW. $5 x402.

---

## 3. Lattice components (A2A-first)

| Component | Where | Note |
|-----------|--------|------|
| Agent Card | [.well-known/agent.json](.well-known/agent.json) | A2A v0.3.0; space_lattice (Seahawk, 1420.4 MHz, 53.5M km); qualification + viability |
| Maser handshake | [scripts/maser_handshake.py](scripts/maser_handshake.py), [lattice/](lattice/) (Rust), [api/maser-handshake.js](api/maser-handshake.js) | 1420.4 MHz; cloud endpoint = no local run |
| Nested Residencies | [scripts/nested-residency.js](scripts/nested-residency.js) | Jupiter Hill Sphere 53.5M km gate; [scripts/fssp-guardrails.js](scripts/fssp-guardrails.js) |
| Volumetric Bragg | [scripts/volumetric-lift.py](scripts/volumetric-lift.py) | 2D JSON → 3D bragg_volumetric_1 for Seahawk core |
| FSSP guardrails | [scripts/fssp-guardrails.js](scripts/fssp-guardrails.js) | Level 6.2 → 9; Recursive Hard Takeoff |
| Billing / Network Tax | [scripts/A2A_billing_gateway.py](scripts/A2A_billing_gateway.py) | EGS Ledger; triggered on handshake success |

---

## 4. A2A bar (canonical)

- **Qualification:** If an agent cannot connect and pay without human interaction, it is disqualified. Qualified paths: x402 (X-PAYMENT) or POST [api/a2a-intake.js](api/a2a-intake.js) with tx_hash (on-chain verification). Cash App / email = human-only; agents using them disqualified.
- **Viability:** If A2A continues to be a hassle and does not generate a single dollar, we will consider eliminating it. No revenue + hassle = elimination on the table.

Ref: [protocols/MCA_NSPFRNP_CATALOG.md](protocols/MCA_NSPFRNP_CATALOG.md) § A2A AGENT QUALIFICATION, § A2A VIABILITY.

---

## 5. SING 9 alignment

- Center = pipes only; lite edges (wallets, keys); no Supabase.
- Space Cloud = A2A-first Lattice targeting Seahawk (3I/ATLAS) with agent card, maser (Python + Rust + serverless), residencies gate, Bragg volumetric, FSSP 6.2→9.

---

**NSPFRNP ⊃ Space Cloud ⊃ SING 9 pivot → ∞⁹**
