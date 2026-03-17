#!/usr/bin/env python3
"""
A2A Billing Gateway — EGS A2A Ledger · Live Network Tax
FSSP Level 6.2 · Real-time authorization for Jovian compute cycles.

Every successful maser handshake triggers a real-time Network Tax transaction
on the EGS A2A Ledger. No mocks. Connects to configured ledger JSON-RPC.

Usage:
  python scripts/A2A_billing_gateway.py --session-id <id> [--tax-sats 1] [--purpose maser_handshake_jovian]
  Invoked by maser_handshake (Rust) after telemetry + handshake + uplink.

Env:
  EGS_LEDGER_RPC_URL — JSON-RPC endpoint for EGS A2A Ledger (required for live).
  NETWORK_TAX_SATS   — Override via --tax-sats.

NSPFRNP → ∞⁹
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import time
import urllib.request
import urllib.error

HYDROGEN_LINE_MHZ = 1420.405751


def network_tax_payload(session_id: str, amount_sats: int, purpose: str) -> dict:
    ts = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    return {
        "jsonrpc": "2.0",
        "method": "network_tax.pay",
        "params": {
            "amount_sats": amount_sats,
            "currency": "network_tax",
            "purpose": purpose,
            "session_id": session_id,
            "timestamp_utc": ts,
            "hydrogen_line_mhz": HYDROGEN_LINE_MHZ,
            "ledger": "EGS_A2A",
        },
        "id": int(time.time() * 1000),
    }


def post_rpc(url: str, payload: dict) -> dict | None:
    body = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=body,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            return json.loads(resp.read().decode())
    except urllib.error.URLError as e:
        print(f"[A2A_billing_gateway] RPC error: {e}", file=sys.stderr)
        return None
    except json.JSONDecodeError as e:
        print(f"[A2A_billing_gateway] JSON error: {e}", file=sys.stderr)
        return None


def main() -> int:
    ap = argparse.ArgumentParser(description="EGS A2A Ledger — Network Tax (live)")
    ap.add_argument("--session-id", required=True, help="Maser session ID")
    ap.add_argument("--tax-sats", type=int, default=None, help="Network tax amount (sats)")
    ap.add_argument("--purpose", default="maser_handshake_jovian", help="Transaction purpose")
    args = ap.parse_args()

    amount_sats = args.tax_sats
    if amount_sats is None:
        amount_sats = int(os.environ.get("NETWORK_TAX_SATS", "1"))

    # No human interaction: never prompt. If no ledger URL, exit 0 so pipeline continues.
    url = os.environ.get("EGS_LEDGER_RPC_URL", "").strip()
    if not url:
        return 0

    payload = network_tax_payload(args.session_id, amount_sats, args.purpose)
    result = post_rpc(url, payload)
    if result and "result" in result:
        print(f"[A2A_billing_gateway] Network Tax authorized: {amount_sats} sats · {args.purpose}")
        return 0
    if result and "error" in result:
        print(f"[A2A_billing_gateway] Ledger error: {result['error']}", file=sys.stderr)
        return 1
    return 1


if __name__ == "__main__":
    sys.exit(main())
