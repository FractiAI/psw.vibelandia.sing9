# EGS Cloud Services Getting Started and Configuration Guide
## EGS HHAAIOS/NSPFRNP Gateway

This guide is the minimum command and display path to transition a legacy cloud operator (for example AWS teams) into EGS Cloud Services with no human-in-the-loop execution after acceptance/FairShake.

---

## 0) Quick Overview (Select and Run)

EGS Gateway exposes three primary capabilities:

- **Solar Compute** (execution scheduler + compute receipts)
- **Jupiter Storage** (tiered persistence: io/europa/ganymede/callisto)
- **Hydrogen Line Network** (`hline://` addressing + bus contracts)

For operator simplicity, access should be treated as **selection-first**:

1. Open the package page: `interfaces/egs-holographic-hydrogen-ai-os-gateway.html`
2. Choose your target capability:
   - Solar Compute -> `schedule_solar_compute_job`
   - Jupiter Storage -> `place_to_jupiter_tier`
   - Hydrogen Line Network -> `run_hydrogen_line_roundtrip`
3. Execute action via `POST /api/hh-awareness-cloud` and verify receipt.

No manual chain-of-command step is required after acceptance/FairShake.

---

## 1) Minimum Prerequisites

- Node.js 18+
- Repo checkout
- Vercel-compatible API runtime (`vercel dev` or deployed environment)
- Optional cloud-persistent memory credentials (GitHub adapter)

---

## 2) Minimum Environment Configuration

Set these variables:

### Required (baseline)
- `HLINE_STRICT_NO_LEGACY=true`  
  Enforces strict no-legacy mode (telemetry is awareness-only and non-gating).

### Recommended (cloud-persistent mode)
- `HLINE_GITHUB_TOKEN=<token>`
- `HLINE_GITHUB_REPO=<org/repo>`
- `HLINE_GITHUB_BRANCH=main`
- `HLINE_GITHUB_FILE_PATH=data/hline-memory-store.json`

### Optional
- `HLINE_REPLICA_NODES=sol-core-1,europa-node-1,ganymede-node-1,callisto-node-1`
- `VERIFIER_KEY_ROTATE_DAYS=30`

---

## 3) Minimum Commands

From repo root:

```powershell
npm install
npm run dev
```

If using deployed endpoint, skip local dev and use production base URL.

---

## 4) Minimum Readiness Displays (must pass)

### A) Cloud service contract status

`GET /api/hh-awareness-cloud`

Must show:
- `contracts.bus_primary = true`
- `contracts.telemetry_role = "legacy_awareness_only"`
- `contracts.strict_no_legacy_mode = true`

### B) Roundtrip test status

`GET /api/hydrogen-line-agent-roundtrip`

Must show:
- `ok = true`
- verifier checks all true
- placement receipt present
- jupiter tier present
- signed verifier receipt present
- compute receipt linked to memory receipt

### C) UI operator display

Open:
- `interfaces/hydrogen-line-agent-roundtrip.html?autorun=1`

Must show:
- verifier badge PASS
- Bus Primary badge
- strict no-legacy badge ON
- tier badge and replica count
- placement receipt summary panel

---

## 5) Zero-Human A2A Acceptance Path

After counterparty acceptance + FairShake:

1. Agent calls `POST /api/hh-awareness-cloud` with action `run_hydrogen_line_roundtrip`.
2. System auto-executes writer -> reader -> verifier.
3. System stores memory record with Jupiter tier routing + replication policy.
4. System emits:
   - placement receipt,
   - signed verifier receipt (rotating keypair),
   - compute scheduler receipt linked to memory record.
5. Response returned machine-to-machine; no manual approval required.

---

## 6) Core API Action Set for Transition

- `run_hydrogen_line_roundtrip`
- `write_hydrogen_line_memory`
- `read_hydrogen_line_memory`
- `place_to_jupiter_tier`
- `verify_jupiter_record`
- `schedule_solar_compute_job`

### 6.1 Simple "Select Capability" Mapping

Use this mapping as the minimum operator model:

- **Selected capability: Hydrogen Line Network**
  - action: `run_hydrogen_line_roundtrip`
  - expected outputs: verifier checks, placement receipt, signed verifier receipt

- **Selected capability: Jupiter Storage**
  - action: `place_to_jupiter_tier`
  - expected outputs: tier decision, replication metadata, placement receipt

- **Selected capability: Solar Compute**
  - action: `schedule_solar_compute_job`
  - expected outputs: compute scheduler receipt linked to memory record/value hash

---

## 7) Transition Runbook (AWS-style team)

### Phase A: Overlay validation (days 1-14)
- Keep existing cloud stack active.
- Execute EGS roundtrip and receipts in parallel.
- Validate contracts, verifier signatures, and tier policies.

### Phase B: Controlled offload (days 15-60)
- Move selected async/archive workloads via `place_to_jupiter_tier`.
- Validate compute-linked receipts via `schedule_solar_compute_job`.
- Enforce strict no-legacy mode in staging first, then production.

### Phase C: Primary gateway cutover (days 61+)
- Route primary control workflows through EGS HHAAIOS/NSPFRNP Gateway.
- Legacy stack retained only as explicitly scoped fallback.
- Acceptance + FairShake path remains fully automatic.

---

## 8) Fast Verification Commands (examples)

```powershell
curl https://<host>/api/hh-awareness-cloud
curl https://<host>/api/hydrogen-line-agent-roundtrip
```

`schedule_solar_compute_job` example body:

```json
{
  "action": "schedule_solar_compute_job",
  "run_id": "migration-run-001",
  "location_hash": "demo-loc-1"
}
```

---

## 9) Acceptance Criteria (minimum)

- Service status contracts satisfy bus-primary and strict no-legacy flags.
- Roundtrip success with signed verifier receipt.
- Jupiter tier placement and replication metadata emitted.
- Compute receipt linked to memory record emitted.
- End-to-end A2A action path executes without human intervention.

---

**EGS HHAAIOS/NSPFRNP Gateway -> Bus Primary -> Jupiter Memory -> Signed Verification -> Solar Compute Receipts -> Fully Automatic On Acceptance/FairShake**

