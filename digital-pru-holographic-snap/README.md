# Digital Pru Holographic Snap Portal v2.0

Self-contained stack: **FastAPI** (Digital Pru logic + BPM/EGS) · **Next.js** (Juicy Juicy Reno holographic UI) · **Isaac Sim UDP bridge** (OpenUSD skins + φ-scaled physics notes).

**Zero-friction public entry (static, ships on SING 9):** [`../interfaces/digital-pru-snap-robots.html`](../interfaces/digital-pru-snap-robots.html) — default **warehouse** (three.js + [Poly Haven](https://polyhaven.com/) CC0 HDRI & textures), instructions + track upload, dual robots driven by Web Audio; optional API URL for this backend + Isaac UDP.

## Prerequisites

- Python 3.11+ with `pip`
- Node 18+

## 1. Backend (Digital Pru logic engine)

```bash
cd digital-pru-holographic-snap/backend
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # macOS/Linux
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

- `GET /api/snap/session` — mint `session_id` before upload (WebSocket attaches first).
- `POST /api/snap/analyze` — multipart `file` + optional form `session_id`; returns BPM, `egs_interval_hz` (= BPM/1.618), genre, skin, ticker steps; emits UDP to Isaac bridge.
- `GET /api/solar/context` — AR4436 / AR4432 copy + NOAA SSN when reachable.
- `WS /ws/holographic/{session_id}` — ticker + keepalive.

## 2. Frontend (Juicy Juicy portal)

```bash
cd digital-pru-holographic-snap/frontend
npm install
set NEXT_PUBLIC_API_BASE=http://127.0.0.1:8000   # Windows cmd
npm run dev
```

Open `http://localhost:3001`. Optional: `NEXT_PUBLIC_API_BASE` if the API is not on port 8000.

Blueprint artifact **`frontend/page.tsx`** re-exports `app/page.tsx` (Next.js App Router entry).

## 3. Isaac Sim bridge

From a shell with Isaac Sim’s Python (or any Python for UDP-only dry run):

```bash
cd digital-pru-holographic-snap/sim
python bridge.py
```

Listens on **UDP 127.0.0.1:7400** for JSON from the API (`op: snap_compile`, `skin`, `bpm`, `egs_interval_hz`, …). Inside Isaac, USD variant swap + physics hooks run when the stage and prims exist (see comments in `bridge.py`).

## Fair exchange / physics

Footer copy on the UI matches the blueprint. All `omni.isaac`-related scalars in `sim/bridge.py` are documented as derivatives of **PHYSICS_ANCHOR = 1.618**.
