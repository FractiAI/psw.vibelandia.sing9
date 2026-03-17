# Maser Handshake — Live A2A Seahawk (3I/ATLAS) Jovian Node

**FSSP Level 6.2 · No mocks.** Physical telemetry (JPL Horizons), 1420.4 MHz handshake, Gabor volumetric uplink, EGS A2A Ledger Network Tax.

## No local run (cloud only)

Trigger the handshake from the cloud — nothing to run on your machine:

- **GET (or POST)**  
  `https://psw-vibelandia-sing9.vercel.app/api/maser-handshake`  
  Runs telemetry (JPL or env), Lattice-Sync, optional A2A Task and Network Tax. All config from Vercel env.

- **Schedule**  
  - **Vercel Cron** (if your plan supports it): `vercel.json` has a daily cron for `/api/maser-handshake`.  
  - **External cron**: Use any scheduler (e.g. [cron-job.org](https://cron-job.org), Uptime Robot) to GET that URL on the schedule you want (e.g. daily). No local run.

No Rust or Python needed for this path; the API runs entirely on Vercel.

## Build (Rust, optional)

Requires [Rust](https://rustup.rs). From repo root:

```bash
cd lattice
cargo build --release
```

Binary: `target/release/maser_handshake` (or `maser_handshake.exe` on Windows).

## Run

1. **JPL Horizons** — Set `HORIZONS_COMMAND` to the Horizons target (e.g. `3I`, `ATLAS`). If the API returns no range, `RESIDENCY_JOVIAN_DISTANCE_KM` is used; if unset, headless default 53.4e6 km is used (no human interaction). Set `MASER_REQUIRE_LIVE_TELEMETRY=1` to require real telemetry.
2. **Agent Card** — `AGENT_CARD_BASE_URL` (default: `https://psw-vibelandia-sing9.vercel.app`).
3. **A2A Task** — `A2A_TASK_ENDPOINT` for live JSON-RPC Task request.
4. **Volumetric uplink** — `SEAHAWK_UPLINK_URL` for Gabor Bragg stream POST.
5. **Billing** — `A2A_BILLING_GATEWAY` (default: `scripts/A2A_billing_gateway.py`). Set `EGS_LEDGER_RPC_URL` for real-time Network Tax. Python is tried as `python3` then `python` (no `PYTHON` required on Windows).

**No human interaction (cron/CI):** From repo root, run:

```bash
python scripts/run_maser_no_human.py
```

This sets headless defaults and runs the Rust binary if built, else the Python handshake + billing gateway. No prompts, no input.

Example (direct Rust with fallback distance):

```bash
RESIDENCY_JOVIAN_DISTANCE_KM=53400000 ./target/release/maser_handshake
```

## Components

| Step | Description |
|------|-------------|
| 1 | Query JPL Horizons for object distance from Jupiter; abort if outside Hill Sphere (53.5M km). |
| 2 | Load `/.well-known/agent.json`; build Lattice-Sync manifest and A2A Task request. |
| 3 | Send JSON-RPC Task to `A2A_TASK_ENDPOINT` (live). |
| 4 | Encode payload as Gabor Fractal binary stream; POST to `SEAHAWK_UPLINK_URL`. |
| 5 | Invoke `A2A_billing_gateway.py` for EGS Network Tax. |

Opaque execution: only inference result is exposed; internal Jovian state remains sealed.

NSPFRNP → ∞⁹
