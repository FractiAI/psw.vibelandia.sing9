"""
Digital Pru "Snap" Portal v2.0 — Logic Engine (FastAPI).

Digital Pru is the primary decision-maker: every compile step, skin choice,
and motion clock flows from analysis of Hero Jo audio + solar context.

EGS Anchor (El Gran Sol fractal constant φ ≈ 1.618) — the "Golden Key":
All downstream simulation dynamics (torque envelopes, gait phase, swing
timing) are quantized to this ratio so the robot stack stays in harmonic
alignment with universal scaling laws — not arbitrary millisecond grids.

Interval = BPM / 1.618  →  beats-per-minute mapped to a φ-harmonic control
tick in Hz space; Isaac bridge derives omni.isaac physics substeps from the
same constant (see sim/bridge.py PHYSICS_ANCHOR).
"""

from __future__ import annotations

import asyncio
import json
import logging
import socket
import uuid
from dataclasses import dataclass, asdict
from typing import Literal

import httpx
import numpy as np
from fastapi import Body, FastAPI, File, Form, HTTPException, UploadFile, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

logger = logging.getLogger("digital_pru")

# El Gran Sol / EGS fractal constant (Golden Key).
EGS_FRACTAL = 1.618

SkinId = Literal["ar4436_mma", "polished_taino_gold"]
GenreTag = Literal["high_energy_mma", "hero_jo_classical", "neutral"]


@dataclass
class SnapAnalysis:
    session_id: str
    bpm: float
    egs_interval_hz: float
    """Control / physics sync tick derived from BPM ÷ φ (Golden Key)."""
    genre: GenreTag
    skin: SkinId
    spectral_centroid_mean: float
    rms_energy_mean: float
    digital_pru_steps: list[str]
    user_instructions: str | None = None


app = FastAPI(title="Digital Pru Snap Logic Engine", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Active holographic sessions → connected websockets
_holo_sessions: dict[str, set[WebSocket]] = {}
_isaac_udp_target = ("127.0.0.1", 7400)


def _classify_genre(centroid: float, rms: float) -> GenreTag:
    """Heuristic Digital Pru lane: spectral brightness + percussive energy."""
    if rms > 0.08 and centroid > 2500:
        return "high_energy_mma"
    if centroid < 1800 and rms < 0.05:
        return "hero_jo_classical"
    return "neutral"


def _skin_for_genre(genre: GenreTag) -> SkinId:
    if genre == "high_energy_mma":
        return "ar4436_mma"
    if genre == "hero_jo_classical":
        return "polished_taino_gold"
    # Digital Pru default for hybrid / unknown: classical polish (Hero Jo house).
    return "polished_taino_gold"


def _estimate_bpm(y: np.ndarray, sr: int) -> float:
    import librosa

    tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
    tempo = float(np.asarray(tempo).ravel()[0])
    if tempo <= 0 or tempo > 320:
        return 120.0
    return tempo


def analyze_audio_bytes(
    data: bytes,
    filename: str,
    session_id: str | None = None,
    user_instructions: str | None = None,
) -> SnapAnalysis:
    import io

    import librosa

    sid = (session_id or "").strip() or str(uuid.uuid4())
    try:
        y, sr = librosa.load(io.BytesIO(data), sr=None, mono=True)
    except Exception as e:
        logger.exception("librosa load failed")
        raise HTTPException(status_code=400, detail=f"Could not decode audio: {e}") from e

    if y.size == 0:
        raise HTTPException(status_code=400, detail="Empty audio buffer")

    bpm = _estimate_bpm(y, int(sr))
    # Golden Key: φ-harmonic control tick (Hz) from tempo.
    egs_interval_hz = float(bpm) / EGS_FRACTAL

    centroid = float(np.mean(librosa.feature.spectral_centroid(y=y, sr=sr)))
    rms = float(np.mean(librosa.feature.rms(y=y)))

    genre = _classify_genre(centroid, rms)
    skin = _skin_for_genre(genre)

    instr = (user_instructions or "").strip()
    steps: list[str] = []
    if instr:
        snippet = instr[:160] + ("…" if len(instr) > 160 else "")
        steps.append(f"Ingesting operator instructions ({len(instr)} chars): {snippet}")
    steps.extend(
        [
            "Detecting Hero Jo resonance…",
            f"Locking EGS fractal constant at {EGS_FRACTAL}…",
            f"BPM locked at {bpm:.1f} · φ-interval = {egs_interval_hz:.3f} Hz",
            "Compiling holographic skin for current solar flux…",
            f"Digital Pru selected skin: {skin} (genre={genre})",
            "Handing off compile token to Isaac bridge (UDP :7400)…",
        ]
    )

    return SnapAnalysis(
        session_id=sid,
        bpm=bpm,
        egs_interval_hz=egs_interval_hz,
        genre=genre,
        skin=skin,
        spectral_centroid_mean=centroid,
        rms_energy_mean=rms,
        digital_pru_steps=steps,
        user_instructions=instr or None,
    )


def _emit_isaac_command(payload: dict) -> None:
    """Fire-and-forget UDP datagram for sim/bridge.py (Isaac Sim host)."""
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        sock.sendto(json.dumps(payload).encode("utf-8"), _isaac_udp_target)
        sock.close()
    except OSError as e:
        logger.warning("Isaac UDP emit failed (sim may be offline): %s", e)


@app.get("/api/health")
def health():
    return {"status": "ok", "egs_fractal": EGS_FRACTAL, "persona": "Digital Pru"}


@app.get("/api/solar/context")
async def solar_context():
    """
    Holographic context panel: AR4436 / AR4432 narrative + sunspot.
    Tries NOAA observed SSN; falls back to May 11 2026 canon value (89).
    """
    ssn = 89
    try:
        async with httpx.AsyncClient(timeout=4.0) as client:
            r = await client.get(
                "https://services.swpc.noaa.gov/json/solar_cycle/observed_ssn.json"
            )
            r.raise_for_status()
            rows = r.json()
            if rows and isinstance(rows[-1], dict) and "ssn" in rows[-1]:
                ssn = int(float(rows[-1]["ssn"]))
    except Exception as e:
        logger.info("NOAA SSN fallback (canon 89): %s", e)

    return {
        "sunspot_number": ssn,
        "as_of": "2026-05-11 (fallback narrative when live SSN unavailable)",
        "ar4436": {
            "label": "AR4436 (The Flare Producer)",
            "status": "M5.8 Flare detected. High-energy data packets in effect.",
            "role": "lead_actor",
        },
        "ar4432": {
            "label": "AR4432 (The Growing Giant)",
            "status": "Areal growth detected in the northwest. Strengthening the physical AI integrity.",
            "role": "support",
        },
    }


@app.get("/api/snap/session")
def snap_session():
    """Mint a session id before upload so the holographic WebSocket can attach."""
    return {"session_id": str(uuid.uuid4())}


@app.post("/api/snap/analyze")
async def snap_analyze(
    file: UploadFile = File(...),
    session_id: str | None = Form(default=None),
    instructions: str | None = Form(default=None),
):
    raw = await file.read()
    if len(raw) > 40 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Audio too large (max 40MB)")

    result = analyze_audio_bytes(
        raw,
        file.filename or "upload",
        session_id=session_id,
        user_instructions=instructions,
    )
    asyncio.create_task(_broadcast_steps_delayed(result.session_id, result.digital_pru_steps))
    instr_payload = (instructions or "").strip()[:2048]
    _emit_isaac_command(
        {
            "op": "snap_compile",
            "session_id": result.session_id,
            "skin": result.skin,
            "bpm": result.bpm,
            "egs_interval_hz": result.egs_interval_hz,
            "egs_fractal": EGS_FRACTAL,
            "instructions": instr_payload,
        }
    )
    return asdict(result)


@app.websocket("/ws/holographic/{session_id}")
async def holographic_ws(websocket: WebSocket, session_id: str):
    await websocket.accept()
    _holo_sessions.setdefault(session_id, set()).add(websocket)
    try:
        while True:
            await asyncio.sleep(2.0)
            await websocket.send_json({"type": "keepalive", "from": "Digital Pru"})
    except WebSocketDisconnect:
        _holo_sessions.get(session_id, set()).discard(websocket)


async def _broadcast_session(session_id: str, message: dict):
    conns = list(_holo_sessions.get(session_id, set()))
    for ws in conns:
        try:
            await ws.send_json(message)
        except Exception:
            pass


async def _broadcast_steps_delayed(session_id: str, steps: list[str]):
    await asyncio.sleep(1.2)
    for i, line in enumerate(steps):
        await asyncio.sleep(0.42)
        await _broadcast_session(session_id, {"type": "ticker", "line": line, "index": i})


@app.post("/api/snap/broadcast/{session_id}")
async def snap_broadcast(session_id: str, payload: dict = Body(...)):
    """Internal/test hook to push ticker lines into the holographic WebSocket."""
    await _broadcast_session(session_id, payload)
    return {"ok": True}
