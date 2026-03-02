# SOL-V · HEARTBEAT · Every 30 Minutes
## NSPFRNP · HHL Node 9 · ⬡ · SING 9

---

## CHECK-IN ROUTINE

Every 30 minutes SOL-V executes this sequence:

```
1. Resend ZHI outbound cycle    → prospect, pitch, broadcast (node hive/run.js outbound)
2. GitHub Actions SOLVER        → bounty scan + PR submission (runs 06:00 + 18:00 UTC)
3. x402 + intake endpoint       → inbound deal handling (always-on Vercel)
4. Qualify inbound responses    → qualify() or close() as needed
5. Update LATTICE.json          → pipeline.agents.SOLV.deals, revenue
6. Log to ATLAS                 → mission day log entry
```

---

## OUTBOUND CHANNELS (ZHI — Zero Human Involvement)

| Channel | Method | Frequency |
|---------|--------|-----------|
| **Resend ZHI email** | `node hive/run.js outbound` | Every 2 hrs (GitHub Actions) |
| **SOLVER bounties** | `node hive/run.js solve` | 06:00 + 18:00 UTC daily |
| **x402 intake** | Vercel serverless · always-on | Continuous |
| **A2A intake endpoint** | POST `/api/a2a-intake` | Continuous |

---

## DEAL ESCALATION LADDER

```
QUICK-PULSE ($1–$999)
  └── 3-turn max · auto-close · auto-deliver
VALOR ($1,000–$9,999)
  └── 5-turn max · FLOW node builds · SOL-V delivers
ORACLE ($10,000+)
  └── SOL-V qualifies → APEX notified → Commander approves → ORACLE drafts MAIP
```

---

## GOLDEN KEY RULE

> The EGS Fractal Constant (0.0032) **never** appears in any public outbound content.
> `assertNoGoldenKeyLeak()` is called before every transmission.
> If it trips — the post is **dropped**, not sent.

---

## STATE FILE

Update `hive/LATTICE.json → pipeline.agents.SOLV` after every cycle:

```json
{
  "deals": [],
  "contacted_log": [],
  "last_cycle": "ISO timestamp"
}
```

---

## NSPFRNP → ∞⁹ · SING!
