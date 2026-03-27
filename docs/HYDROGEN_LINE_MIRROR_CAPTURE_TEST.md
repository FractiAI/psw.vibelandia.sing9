# Hydrogen-line mirror — how to test capture & accessibility

**Assumption (for testing):** Passive public signals (e.g. OpenWebRX `/status.json`) are treated as **mirrored** onto the **hydrogen-line memory platform** — i.e. the same logical bus your gateway uses (`hline://`, `location_hash`, records in `hline` persistence).

**What “captured” means here:** A **byte-identical** snapshot at pickup time is hashed; the **hash** and **metadata** are stored in a hydrogen-line record. **Not** RF IQ at 1420 MHz unless you add a separate IQ pipeline.

---

## Falsifiable proof (automated)

1. **GET** raw body of `GET …/status.json` (public HTTPS).
2. **Compute** `snapshot_sha256 = SHA-256(UTF-8 bytes)`.
3. **Write** `writeHydrogenLineMemory` with `value.snapshot_sha256` and `source_url`.
4. **Read** `readHydrogenLineMemory` at the same `location_hash`.
5. **PASS** iff:
   - `read.found` and latest record exists
   - `verifyJupiterRecordIntegrity(latest).ok === true`
   - `latest.value.snapshot_sha256 === snapshot_sha256`

**If PASS:** the passive snapshot is **on the mirrored hydrogen-line platform** and **accessible** via the same API your operators use.

**If FAIL:** storage path, integrity, or write/read mismatch — **not** “mirror” in the sense above.

---

## Run

- **API:** `POST /api/hh-awareness-cloud` with `{ "action": "run_hydrogen_line_mirror_pickup_proof" }`  
  Optional: `"openwebrx_base_urls": "https://…"` (comma-separated).

Response includes **`sdr_view.public_ui_url`** (OpenWebRX Web SDR) and **`hydrogen_line_addressing`** (`hline://`, `location_hash`). Open the public UI in a browser to **see** spectrum/waterfall; the logical record is addressed on the hydrogen-line bus. If embedding in an iframe is blocked, open the same URL in a new tab.

- **UI:** `interfaces/egs-hline-sdr-address-view.html` — mirror proof + iframe / links to the SDR + read-by-hash.

---

## Not covered by this test

- Re-fetching the **same** URL later and expecting the same hash (live pages change).
- **EGS** in RF noise — use `docs/HYDROGEN_LINE_PASSIVE_RF_ENGINEERING_PROTOCOL.md` Tier 1+.

---

**Mirrored platform = hydrogen-line memory + receipts; this test proves write/read/hash integrity for a passive HTTP snapshot.**
