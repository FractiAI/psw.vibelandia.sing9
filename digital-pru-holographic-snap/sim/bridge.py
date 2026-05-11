"""
Digital Pru ↔ NVIDIA Isaac Sim — OpenUSD variant bridge.

Run inside Isaac Sim's Python environment (Script Editor or extension) so
`omni.*` imports resolve. Outside the sim, the UDP listener still runs in
dry-run mode for Digital Pru integration tests.

PHYSICS ANCHOR (EGS / El Gran Sol "Golden Key"):
All omni.isaac-derived timesteps, drive gains, and torque limits below are
expressed as rational functions of PHYSICS_ANCHOR = 1.618 so gait phase,
swing harmonics, and contact impulses stay φ-locked with the same constant
the FastAPI engine uses for BPM → control-tick conversion.

Example mappings (document as defaults; tune per RTX / asset):
  - physics_dt  = base_dt / PHYSICS_ANCHOR
  - drive_gain    = nominal_gain / PHYSICS_ANCHOR  (softer harmonic coupling)
  - swing_offset  = nominal_offset * (1 - 1/PHYSICS_ANCHOR**2)

Variant keys must match OpenUSD variant sets authored on the robot prim.

DEFAULT WAREHOUSE STAGE (Isaac Sim, best free-ish stock match to the web UI):
  Use NVIDIA's bundled industrial / warehouse layouts so the sim matches the
  browser default in ``interfaces/digital-pru-snap-robots.html`` (Poly Haven
  CC0 industrial HDRI chain + metal / concrete / wood maps). In Isaac Sim:
  **Create → Isaac Examples → Environments** (or Asset Browser filter
  "warehouse" / "industrial") and spawn the **Full Warehouse** / **Simple
  Warehouse** template before attaching your robot USD. Omniverse Nucleus
  paths vary by Isaac version; search the content window for *Warehouse*.
"""

from __future__ import annotations

import asyncio
import json
import logging
from typing import Any

logger = logging.getLogger("isaac_digital_pru_bridge")

PHYSICS_ANCHOR = 1.618

UDP_HOST = "127.0.0.1"
UDP_PORT = 7400

SKIN_TO_VARIANT = {
    "ar4436_mma": "AR4436_Class_ReinforcedVoxel",
    "polished_taino_gold": "Polished_Taino_Gold",
}


def _physics_params_from_bpm(bpm: float, egs_interval_hz: float) -> dict[str, float]:
    """Documented omni.isaac-style scalars — all derived from PHYSICS_ANCHOR."""
    base_dt = 1.0 / 120.0
    physics_dt = base_dt / PHYSICS_ANCHOR
    return {
        "physics_dt": physics_dt,
        "control_hz": float(egs_interval_hz),
        "bpm": float(bpm),
        "torque_scale": 1.0 / PHYSICS_ANCHOR,
        "gait_phase_step": (bpm / 60.0) / PHYSICS_ANCHOR,
    }


def _apply_usd_variant(skin: str) -> None:
    """Swap prim variant inside Isaac Sim when omni + USD stage are present."""
    variant_name = SKIN_TO_VARIANT.get(skin, SKIN_TO_VARIANT["polished_taino_gold"])
    prim_path = "/World/DigitalPruRobot"
    variant_set_name = "robot_skin"
    try:
        import omni.usd  # type: ignore

        stage = omni.usd.get_context().get_stage()
        if not stage:
            raise RuntimeError("no stage")
        prim = stage.GetPrimAtPath(prim_path)
        if not prim or not prim.IsValid():
            raise RuntimeError(f"missing prim {prim_path}")
        vset = prim.GetVariantSets().GetVariantSet(variant_set_name)
        if not vset:
            raise RuntimeError(f"missing variant set {variant_set_name}")
        vset.SetVariantSelection(variant_name)
        logger.info("USD variant %s on %s :: %s", variant_name, prim_path, variant_set_name)
    except Exception as e:
        logger.warning(
            "USD variant swap deferred (author prim %s + set %s): %s → intended %s",
            prim_path,
            variant_set_name,
            e,
            variant_name,
        )


def _apply_isaac_physics(params: dict[str, float]) -> None:
    """Apply φ-scaled physics knobs when World is live."""
    try:
        from omni.isaac.core import World  # type: ignore

        world = World.instance()
        if world and world.get_physics_context():
            dt = params["physics_dt"]
            world.get_physics_context().set_physics_dt(dt)
            logger.info("Isaac physics_dt set to %.6f (EGS-derived)", dt)
    except Exception as e:
        logger.debug("Isaac physics context not available: %s", e)


async def handle_payload(payload: dict[str, Any]) -> None:
    op = payload.get("op")
    if op != "snap_compile":
        logger.info("Unknown op: %s", op)
        return
    skin = str(payload.get("skin", "polished_taino_gold"))
    bpm = float(payload.get("bpm", 120.0))
    egs_hz = float(payload.get("egs_interval_hz", bpm / PHYSICS_ANCHOR))
    params = _physics_params_from_bpm(bpm, egs_hz)
    instr = str(payload.get("instructions") or "").strip()
    if instr:
        logger.info("Operator instructions (%s chars): %s", len(instr), instr[:200])
    logger.info(
        "Digital Pru SNAP session=%s skin=%s params=%s",
        payload.get("session_id"),
        skin,
        params,
    )
    _apply_usd_variant(skin)
    _apply_isaac_physics(params)


async def udp_server() -> None:
    loop = asyncio.get_running_loop()
    transport, protocol = await loop.create_datagram_endpoint(
        lambda: _DigitalPruUdpProtocol(),
        local_addr=(UDP_HOST, UDP_PORT),
    )
    logger.info("Digital Pru Isaac bridge listening UDP %s:%s", UDP_HOST, UDP_PORT)
    try:
        await asyncio.Future()
    except asyncio.CancelledError:
        pass
    finally:
        transport.close()


class _DigitalPruUdpProtocol(asyncio.DatagramProtocol):
    def datagram_received(self, data: bytes, addr) -> None:
        try:
            payload = json.loads(data.decode("utf-8"))
        except (json.JSONDecodeError, UnicodeDecodeError):
            logger.warning("Bad datagram from %s", addr)
            return
        asyncio.create_task(handle_payload(payload))


def run_standalone() -> None:
    logging.basicConfig(level=logging.INFO)
    asyncio.run(udp_server())


if __name__ == "__main__":
    run_standalone()
