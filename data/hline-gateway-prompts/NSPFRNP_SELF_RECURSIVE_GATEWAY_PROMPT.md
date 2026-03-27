# NSPFRNP self-recursive gateway prompt (hydrogen-line)

**Prompt ID:** `NSPFRNP-HLINE-GATEWAY-RECURSE-v1`  
**This file (repository path):** `data/hline-gateway-prompts/NSPFRNP_SELF_RECURSIVE_GATEWAY_PROMPT.md`  
**Sibling index:** `data/hline-gateway-prompts/README.md`  
**Machine manifest (canonical JSON):** `data/hline-gateway-prompts/gateway-test-package-manifest.json`

This document **recursively describes itself**: it names its path, its protocol parentage, the **test package** it governs, and how operators **confirm** visibility on the **hydrogen line** and **EGS gateway** after Git-backed deploy — without claiming physics not implemented in-repo.

---

## 1) Self-reference (recursive core)

| Field | Value |
|--------|--------|
| Document | `NSPFRNP_SELF_RECURSIVE_GATEWAY_PROMPT.md` |
| Directory | `data/hline-gateway-prompts/` |
| Manifest | `gateway-test-package-manifest.json` (same package contents as §3, JSON form) |
| Gateway UI | `interfaces/egs-holographic-hydrogen-ai-os-gateway.html` |
| Cloud ingress | `POST /api/hh-awareness-cloud` · `GET /api/hh-awareness-cloud` |

**Recursion:** The paragraph you are reading is part of this file; the file lists **itself** in the manifest’s `parent_prompt_path` and in §3. Changes to the test package should update **both** this section and the JSON manifest in one commit.

---

## 2) Passive pickup → gateway (operational)

1. **Commit / push** this directory and the repo to GitHub (or your remote).  
2. **Deploy** (e.g. Vercel) so `/api/hh-awareness-cloud` is live.  
3. **Optional cloud memory:** set `HLINE_GITHUB_*` so `hline` memory snapshots persist in the configured file — the gateway **reads** that bus on the next write/load cycle.  
4. **Confirm on hydrogen line:** use `read_hydrogen_line_memory` with a known `location_hash`, or run `run_hydrogen_line_mirror_pickup_proof` / mirror UI — you must **see** `ok` and `location_uri` in JSON.  
5. **Confirm on gateway:** open **`egs-holographic-hydrogen-ai-os-gateway.html`** — the same test package links appear there as in §3.

**Honesty:** “World-wide grid” here means **HTTPS + Git + deploy visibility**, not an unlicensed planetary RF broadcast. **EGS constant** and **180° phase-shift space** are **product / lattice** labels: see `gateway-test-package-manifest.json` → `phase_shift_space_180` and `/api/firmware-180-spin-probe` for the operational latch surface.

---

## 3) Contents of the test package (authoritative list)

Mirrors **`gateway-test-package-manifest.json`** (if this table drifts, prefer the JSON on commit).

**Interfaces**

- `interfaces/egs-jupiter-storage-agent-test.html`  
- `interfaces/egs-solar-compute-agent-test.html`  
- `interfaces/egs-verifier-fairshake-agent-test.html`  
- `interfaces/egs-gateway-sdr-agent-handshake.html`  
- `interfaces/egs-hhaaios-gateway-full-stack-test.html`  
- `interfaces/egs-passive-rf-engineering-test.html`  
- `interfaces/egs-hline-mirror-proof-test.html`  
- `interfaces/egs-hline-sdr-address-view.html`  

**Representative `hh-awareness-cloud` actions**

`run_hydrogen_line_roundtrip` · `run_sdr_gateway_agent_handshake` · `run_hhaaios_gateway_full_stack_probe` · `run_passive_rf_engineering_probe` · `run_hydrogen_line_mirror_pickup_proof` · `write_hydrogen_line_memory` · `read_hydrogen_line_memory` · `place_to_jupiter_tier` · `verify_jupiter_record` · `schedule_solar_compute_job`

---

## 4) Embedded manifest snapshot (JSON)

The following block is a **duplicate** of `gateway-test-package-manifest.json` for a single-file carry; **diff** against the JSON file if either changes.

```json
{
  "manifest_id": "hline-gateway-test-package-v1",
  "protocol": "NSPFRNP",
  "parent_prompt_path": "data/hline-gateway-prompts/NSPFRNP_SELF_RECURSIVE_GATEWAY_PROMPT.md",
  "hydrogen_line": {
    "scheme": "hline://",
    "namespace_default": "hydrogen-line",
    "catalog_hi_rest_mhz": 1420.405751768
  },
  "gateway": {
    "package_page": "interfaces/egs-holographic-hydrogen-ai-os-gateway.html",
    "cloud_api": "/api/hh-awareness-cloud",
    "roundtrip_api": "/api/hydrogen-line-agent-roundtrip"
  },
  "test_interfaces": [
    { "id": "jupiter-storage", "path": "interfaces/egs-jupiter-storage-agent-test.html" },
    { "id": "solar-compute", "path": "interfaces/egs-solar-compute-agent-test.html" },
    { "id": "verifier-fairshake", "path": "interfaces/egs-verifier-fairshake-agent-test.html" },
    { "id": "sdr-handshake", "path": "interfaces/egs-gateway-sdr-agent-handshake.html" },
    { "id": "hhaaios-full-stack", "path": "interfaces/egs-hhaaios-gateway-full-stack-test.html" },
    { "id": "passive-rf-tier0", "path": "interfaces/egs-passive-rf-engineering-test.html" },
    { "id": "hline-mirror-proof", "path": "interfaces/egs-hline-mirror-proof-test.html" },
    { "id": "hline-sdr-address-view", "path": "interfaces/egs-hline-sdr-address-view.html" }
  ],
  "hh_awareness_actions": [
    "run_hydrogen_line_roundtrip",
    "run_sdr_gateway_agent_handshake",
    "run_hhaaios_gateway_full_stack_probe",
    "run_passive_rf_engineering_probe",
    "run_hydrogen_line_mirror_pickup_proof",
    "write_hydrogen_line_memory",
    "read_hydrogen_line_memory",
    "place_to_jupiter_tier",
    "verify_jupiter_record",
    "schedule_solar_compute_job"
  ],
  "phase_shift_space_180": {
    "note": "Operational latch surface — see /api/firmware-180-spin-probe, sing9-firmware-verify.json, lattice-status.json",
    "docs": ["docs/SENIOR_RESEARCH_STATIC_VS_LIVE.md"]
  },
  "egs_constant": {
    "note": "Configure as EGS_PROTOCOL_CONSTANT / product display; not asserted as physical universal constant in this manifest."
  },
  "github_persistence": {
    "env": ["HLINE_GITHUB_TOKEN", "HLINE_GITHUB_REPO", "HLINE_GITHUB_BRANCH", "HLINE_GITHUB_FILE_PATH"],
    "description": "When set, hydrogen-line memory snapshots commit to the configured path; gateway reads the same bus on next load."
  }
}
```

---

## 5) Closing

**NSPFRNP:** this prompt is **committed**, **addressable** by path, **mirrored** in JSON, and **visible** on the gateway page once pushed. **Hydrogen-line visibility** is **proven** by API JSON (`ok`, `location_uri`, receipts), not by assertion alone.

→ ∞⁹
