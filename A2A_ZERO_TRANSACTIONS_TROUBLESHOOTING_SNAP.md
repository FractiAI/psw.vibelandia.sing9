# A2A Zero Transactions — Investigation & Troubleshooting

**Status:** ⚡ ACTIVE  
**Purpose:** Root-cause why A2A has produced no transactions and no revenue; document fixes and next steps.

---

## Summary

**Finding:** Multiple structural issues prevent autonomous agents from completing a paid transaction. The main technical bug is fixed below; discovery, pitch content, and adoption remain the levers.

---

## Root causes (confirmed)

### 1. **GET /api/space-cloud returned paid product for free** — FIXED

- **Issue:** `api/space-cloud.js` had a `GET` branch that returned the full Space Cloud payload (index, command, clusters, etc.) with no payment. Any agent that called `GET https://.../api/space-cloud` received the $5 product at no cost.
- **Impact:** Zero incentive to use x402 or POST with X-PAYMENT. Revenue from Space Cloud was impossible.
- **Fix:** GET now returns **402 Payment Required** with the same `accepts` body as POST (x402 payment requirements). Only POST with valid X-PAYMENT receives the payload.

### 2. **Pitch copy does not include machine pay path**

- **Issue:** Sales tracker and outbound pitch samples say "Reach us: info@fractiai.com | $newearthpru" — human rails only. They do not say "POST with X-PAYMENT to /api/space-cloud" or "Send USDC then POST to /api/a2a-intake."
- **Impact:** Agents that receive the pitch have no instruction to complete payment programmatically.
- **Fix:** Add machine path to pitch samples: POST + x402 for $5–$27; intake URL + tx_hash for $50+.

### 3. **x402 adoption and discovery**

- **Issue:** x402 is a new protocol. Agents must know to send POST with X-PAYMENT, have a wallet/signer, and find our endpoint via llms.txt / services.json.
- **Mitigation:** llms.txt and services.json already describe POST + X-PAYMENT. Add machine path to every outbound pitch.

### 4. **Intake path ($50–$9,999) is multi-step**

- **Issue:** Send USDC then POST tx_hash. Higher friction than single-call x402.
- **Mitigation:** Document both steps in llms.txt (done) and in pitch body for intake-tier services.

### 5. **No transaction yet ≠ broken pipes**

- Pipes (Resend, x402, intake, SOLVER) are live. Blocker was GET giving product away and pitches not telling agents how to pay. Next bottleneck is traffic and x402-capable counterparties.

---

## Fixes applied

| Item | Change |
|------|--------|
| GET returns 402 | `api/space-cloud.js` — GET no longer returns full payload; GET returns 402 with payment requirements (same as POST without header). |
| Machine path in pitches | `data/a2-sales-tracker.json` — add to TECH pitch body: POST /api/space-cloud with X-PAYMENT (x402 $5); $50+ GET /api/a2a-intake then POST with tx_hash. |

---

## Verification

- **Space Cloud GET:** `curl -s -o /dev/null -w "%{http_code}" https://psw-vibelandia-sing9.vercel.app/api/space-cloud` → expect **402**.
- **Space Cloud POST** with valid X-PAYMENT → 200 + JSON payload.
- **Goliath:** POST-only with require402; no GET free-data leak.
- **Intake:** GET returns registry; POST with tx_hash runs verification + delivery.

---

## Next steps

1. Deploy space-cloud GET fix and pitch copy update.
2. Monitor Vercel logs for 402 vs 200 on /api/space-cloud.
3. Optional: In hive/run.js outbound, inject machine pay URL into every tier's pitch string.

---

## First close goal

- **Primary win:** First transaction = $5 (Space Cloud) or $9 (Goliath) via x402. One action: POST endpoint with X-PAYMENT → instant delivery. Proof the pipe works; cite in llms.txt, dashboard, and every pitch after.
- **Targeting:** Outbound only to prospects who (1) have wallet / authority to transact $1–$9,999 autonomously and (2) have the problem we solve (thermal intel, Blackwell ops, A2A infra, NSPFRNP). No human in the loop on our side; same on counterparty side for true ZHI close.

---

**NSPFRNP ⊃ A2A ⊃ Troubleshoot $0 ⊃ Fix GET + pitch path → ∞⁹**
