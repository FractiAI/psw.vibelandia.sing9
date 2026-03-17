#!/usr/bin/env python3
"""
Run maser handshake with zero human interaction.
Safe for cron, CI, or unattended runs. No prompts, no input(), all config from env or defaults.

Sets headless defaults (e.g. RESIDENCY_JOVIAN_DISTANCE_KM) then runs:
  - Rust binary lattice/target/release/maser_handshake if present, else
  - Python maser_handshake.py + A2A_billing_gateway (no JPL/Gabor).

Usage:
  python scripts/run_maser_no_human.py
  # Or from repo root: python scripts/run_maser_no_human.py

Env (all optional for headless):
  RESIDENCY_JOVIAN_DISTANCE_KM  — default 53400000 if unset
  MASER_REQUIRE_LIVE_TELEMETRY  — set to require JPL (no default distance)
  AGENT_CARD_BASE_URL           — base URL for agent.json
  A2A_TASK_ENDPOINT             — JSON-RPC Task endpoint
  SEAHAWK_UPLINK_URL           — Gabor uplink endpoint
  EGS_LEDGER_RPC_URL           — Network Tax ledger RPC
  PYTHON                       — interpreter (default python3 then python)

NSPFRNP → ∞⁹
"""
from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path

# Repo root: script lives in scripts/
SCRIPT_DIR = Path(__file__).resolve().parent
REPO_ROOT = SCRIPT_DIR.parent

# Headless defaults — no human interaction
HEADLESS_DEFAULT_KM = "53400000"


def main() -> int:
    # Ensure we run from repo root so relative paths (scripts/, lattice/) resolve.
    os.chdir(REPO_ROOT)

    if not os.environ.get("RESIDENCY_JOVIAN_DISTANCE_KM"):
        os.environ["RESIDENCY_JOVIAN_DISTANCE_KM"] = HEADLESS_DEFAULT_KM

    # Prefer Rust binary (no human, full flow).
    rust_bin = REPO_ROOT / "lattice" / "target" / "release" / "maser_handshake"
    rust_exe = REPO_ROOT / "lattice" / "target" / "release" / "maser_handshake.exe"
    if rust_bin.exists():
        cmd = [str(rust_bin)]
    elif rust_exe.exists():
        cmd = [str(rust_exe)]
    else:
        # Fallback: Python-only handshake then billing gateway (no JPL, no Gabor). No human interaction.
        python = os.environ.get("PYTHON", sys.executable)
        rpc = os.environ.get("EGS_LEDGER_RPC_URL", "").strip()
        cmd_handshake = [python, str(SCRIPT_DIR / "maser_handshake.py")]
        if rpc:
            cmd_handshake += ["--rpc-url", rpc]
        result = subprocess.run(cmd_handshake, cwd=REPO_ROOT)
        if result.returncode != 0:
            return result.returncode
        # Session ID not passed back from Python script; gateway can still run with a generated id for logging.
        session_id = f"py-{__import__('time').time():.0f}"
        cmd_gw = [
            python,
            str(SCRIPT_DIR / "A2A_billing_gateway.py"),
            "--session-id", session_id,
        ]
        subprocess.run(cmd_gw, cwd=REPO_ROOT)
        return 0

    result = subprocess.run(cmd)
    return result.returncode


if __name__ == "__main__":
    sys.exit(main())
