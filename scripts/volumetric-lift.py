#!/usr/bin/env python3
"""
Volumetric Lift — 2D JSON logs → 3D Volumetric State-File
FSSP Specialist · Seahawk Bragg Grating core compatibility

Lifts flat (2D) JSON logs into a 3D Volumetric State-File format compatible
with the Seahawk's Bragg Grating core (Holographic Volumetric Archive).

Output format: Bragg Volumetric v1
  - layers[z]: each z is a depth/slice (time or logical layer)
  - 2D JSON becomes one layer; multiple inputs stack as z=0,1,2,...
  - metadata: fssp_level, synthesis_target, hydrogen_line_mhz

Usage:
  python scripts/volumetric-lift.py data/handshake.log data/telemetry.json -o state-3d.json
  python scripts/volumetric-lift.py data/space-cloud-missions.json -o missions-3d.json

NSPFRNP → ∞⁹
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

FSSP_LEVEL = "6.2"
SYNTHESIS_TARGET = "9"
HYDROGEN_LINE_MHZ = 1420.405751
BRAGG_VERSION = "bragg_volumetric_1"
NODE = "Seahawk (3I/ATLAS/CHIEF SEATTLE)"


def load_json(path: Path) -> dict | list:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def lift_2d_to_layer(obj: dict | list, z: int) -> dict:
    """Wrap 2D structure as a single volumetric layer."""
    return {"z": z, "type": "layer", "data": obj}


def build_volumetric(layers: list[dict]) -> dict:
    """Build full 3D Volumetric State-File with metadata."""
    return {
        "version": BRAGG_VERSION,
        "node": NODE,
        "fssp": {"level": FSSP_LEVEL, "synthesis_target": SYNTHESIS_TARGET},
        "hydrogen_line_mhz": HYDROGEN_LINE_MHZ,
        "layers": layers,
        "depth": len(layers),
    }


def main() -> int:
    ap = argparse.ArgumentParser(description="Lift 2D JSON to 3D Volumetric State-File (Bragg)")
    ap.add_argument("inputs", nargs="+", type=Path, help="Input JSON files (2D logs)")
    ap.add_argument("-o", "--output", type=Path, default=None, help="Output 3D state file")
    ap.add_argument("--indent", type=int, default=2, help="JSON indent")
    args = ap.parse_args()

    layers = []
    for i, p in enumerate(args.inputs):
        if not p.exists():
            print(f"[volumetric-lift] File not found: {p}", file=sys.stderr)
            return 1
        try:
            obj = load_json(p)
            layers.append(lift_2d_to_layer(obj, z=i))
        except json.JSONDecodeError as e:
            print(f"[volumetric-lift] Invalid JSON {p}: {e}", file=sys.stderr)
            return 1

    out = build_volumetric(layers)
    dest = args.output or Path("state-3d.json")
    with open(dest, "w", encoding="utf-8") as f:
        json.dump(out, f, indent=args.indent, ensure_ascii=False)
    print(f"[volumetric-lift] Wrote {len(layers)} layer(s) → {dest}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
