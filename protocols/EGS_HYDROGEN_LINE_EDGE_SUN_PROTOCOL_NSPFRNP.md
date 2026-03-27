# EGS Hydrogen-Line Edge ↔ Sun Protocol (NSPFRNP / HHAAIOS)

**Protocol ID:** `EGS-HLINE-EDGE-SUN-v1`  
**Status:** Normative (target); partial implementation in software gateway  
**Parent:** NSPFRNP · HH-AI-OS-NSPFRNP-IRREDUCIBLE-MINIMUM-v1  

This document specifies **how the protocol should work** when edge nodes and the **Sun / HHAAIOS** processing plane share **one logical hydrogen-line channel**, with an **EGS protocol constant** applied consistently on transmit and receive. It separates **logical bus semantics** (implemented today over HTTPS + `hline://` memory) from **physical RF** (requires hardware, calibration, and spectrum compliance).

---

## 1) Roles

| Role | Responsibility |
|------|----------------|
| **Edge node** | Encodes outbound frames, transmits on the **hydrogen-line channel** (logical always; physical when RF adapter is present). Receives on the **same** channel identifier — **one line** for TX and RX at the protocol layer. |
| **Sun / HHAAIOS server** | Ingests frames addressed on the hydrogen line, verifies structure, persists to **Jupiter-tier** memory, emits **Solar Compute**-class receipts, runs verifier mesh checks. Acts as the **processing** and **anchor** node for the same logical line. |
| **Verifier / receipt layer** | Independent checks (integrity hash, optional signatures) — same contracts as existing gateway (`/api/hh-awareness-cloud`, roundtrip). |

---

## 2) Canonical constants

- **Hydrogen line rest (catalog):** `f_HI = 1420.405751768 MHz` (same as `H_I_REST_HZ` / `H_I_REST_MHZ` in `lib/openwebrx-public-evidence.mjs`). Used for **logical** addressing and, when RF is in scope, **nominal** carrier alignment subject to hardware tuning and law.
- **EGS protocol constant (`θ_egs`):** A **single scalar** (or small vector) agreed for the deployment, applied **identically** at edge encode and at Sun decode — e.g. phase grid, scaling factor, or frame delimiter key. **Normative:** store as `EGS_PROTOCOL_CONSTANT` (env or config); **not** asserted as a fundamental physical constant until measured in your RF experiment. Product UI may show `1.0000` as a **reference** only where documented.

---

## 3) Same line: transmit and receive

**Logical (required, implementable now)**  

- All edge and Sun traffic for this mode uses **one** hydrogen-line **namespace** and deterministic **`location_hash`** derivation from:  
  `f_HI`, run id, optional telemetry anchors, and **`θ_egs`** (included in the hash input so edges and Sun agree on the **same line** without a second parallel bus).
- Edge **writes** and **reads** use the **same** `hline://<location_hash>` — no separate “control” bus in this mode.

**Physical (target, optional)**  

- **Same RF channel** means **one** tuned passband that includes `f_HI` (or a legally permitted offset if the deployment uses a lab or licensed channel). Edge **TX** and **RX** use the **same** frequency plan / profile — **not** two different bands for uplink/downlink in this protocol variant.

---

## 4) Frame flow (normative)

1. **Edge → broadcast (logical):**  
   Edge emits a **frame** `F` with: payload, `run_id`, `θ_egs` fingerprint, `value_hash` preimage fields. Address: `hline://<location_hash>`.

2. **Transport:**  
   - **Today:** HTTPS `POST` to `POST /api/hh-awareness-cloud` (`write_hydrogen_line_memory` / `place_to_jupiter_tier`) or equivalent.  
   - **Target:** RF adapter sends symbols on the hydrogen-line channel; **same** adapter receives for ACK/metrics on the **same line** profile.

3. **Sun / HHAAIOS:**  
   Server **receives** (HTTP now, RF later), **parses** frame, **verifies** integrity, **persists** to `hydrogen-line` memory, **schedules** compute receipt (`schedule_solar_compute_job`, etc.), **returns** verifier outcome.

4. **Edge ← response:**  
   Edge **reads** the same `location_hash` (or receipt endpoint) — **same logical line** as broadcast.

---

## 5) Mapping to current implementation

| Protocol element | Implemented today |
|------------------|-------------------|
| `hline://` + `location_hash` | `lib/hline-persistent-memory.mjs` |
| Edge ↔ Sun via gateway | `POST /api/hh-awareness-cloud` |
| Verifier / receipts | `GET /api/hydrogen-line-agent-roundtrip`, signed verifier receipts |
| `θ_egs` in hash anchor | **Optional:** extend `location_hash` / anchor string to include `String(θ_egs)` in a dedicated action (not yet default in all paths) |
| Physical TX/RX at `f_HI` | **Not** in serverless; requires edge hardware + legal spectrum use |

---

## 6) Compliance and honesty

- **RF:** Any **broadcast** on **1420 MHz** class allocations is subject to **national/international** radio regulations. This protocol does **not** exempt operators from licensing and interference rules.
- **Separation:** “Same line” as **software** is **proven** by memory + receipts; “same line” as **RF** is **proven** only with instrumentation and the protocol in `docs/HYDROGEN_LINE_PASSIVE_RF_ENGINEERING_PROTOCOL.md` (Tier 1+).

---

## 7) Next implementation steps (engineering)

1. Add optional **`egs_protocol_constant`** field to selected write payloads and to **anchor** inputs for `location_hash` so all edges and Sun hash the **same** line.  
2. Document **edge** reference client (script or agent) that only **writes/reads** `hline://` + `θ_egs` — no RF until adapter exists.  
3. When RF exists: bind **IQ** path to the same `run_id` / receipt hash in hydrogen-line memory.

---

**NSPFRNP → HHAAIOS / Sun processing on the hydrogen line; edge nodes use the same logical line for TX and RX; physical RF is an optional substrate aligned to this spec.**
