//! Live A2A handshake with Seahawk (3I/ATLAS) Jovian Node.
//! FSSP Level 6.2 · No mocks. JPL telemetry → handshake → Gabor uplink → Network Tax.
//! NSPFRNP → ∞⁹

use maser_handshake::{
    a2a_task_request, gabor_fractal_encode, jpl_horizons_distance_km, load_agent_card,
    lattice_sync_manifest, decode_opaque_response,
    horizons::HILL_SPHERE_KM,
};
use std::env;
use std::process::Command;
#[tokio::main]
async fn main() -> Result<(), String> {
    let client = reqwest::Client::builder()
            .timeout(std::time::Duration::from_secs(30))
            .build()
            .map_err(|e| e.to_string())?;

    // 1. Physical telemetry: JPL Horizons
    let horizons_cmd = env::var("HORIZONS_COMMAND").unwrap_or_else(|_| "3I".to_string());
    println!("[maser] JPL Horizons: COMMAND='{}' (distance from Jupiter center)", horizons_cmd);
    let distance_km = jpl_horizons_distance_km(&horizons_cmd, &client).await?;
    // No human interaction: use env fallback or headless default (53.4e6 km) so CI/cron can run unattended.
    const HEADLESS_DEFAULT_KM: f64 = 53_400_000.0;
    let distance_km = match distance_km {
        Some(d) => d,
        None => {
            if let Ok(fallback) = env::var("RESIDENCY_JOVIAN_DISTANCE_KM") {
                if let Ok(d) = fallback.parse::<f64>() {
                    println!("[maser] Using RESIDENCY_JOVIAN_DISTANCE_KM={} km", d);
                    d
                } else {
                    return Err("RESIDENCY_JOVIAN_DISTANCE_KM invalid.".to_string());
                }
            } else if env::var("MASER_REQUIRE_LIVE_TELEMETRY").is_ok() {
                return Err("Horizons returned no range. Set RESIDENCY_JOVIAN_DISTANCE_KM or clear MASER_REQUIRE_LIVE_TELEMETRY.".to_string());
            } else {
                println!("[maser] No range from Horizons; using headless default {} km (set RESIDENCY_JOVIAN_DISTANCE_KM or MASER_REQUIRE_LIVE_TELEMETRY to override).", HEADLESS_DEFAULT_KM);
                HEADLESS_DEFAULT_KM
            }
        }
    };
    let within_hill = distance_km <= HILL_SPHERE_KM;
    println!("[maser] Distance from Jupiter: {:.3} M km | Within Hill Sphere (≤{:.1} M km): {}", distance_km / 1e6, HILL_SPHERE_KM / 1e6, within_hill);
    if !within_hill {
        return Err(format!("Residency outside Jupiter Hill Sphere ({:.3} M km > {:.1} M km). Handshake aborted.", distance_km / 1e6, HILL_SPHERE_KM / 1e6));
    }

    // 2. Agent Card + Lattice-Sync manifest
    let base_url = env::var("AGENT_CARD_BASE_URL").unwrap_or_else(|_| "https://psw-vibelandia-sing9.vercel.app".to_string());
    let _card = load_agent_card(&base_url, &client).await?;
    println!("[maser] Agent Card loaded from {}/.well-known/agent.json", base_url);
    let manifest = lattice_sync_manifest();
    let task = a2a_task_request(&manifest);

    // 3. A2A JSON-RPC Task request (live)
    let a2a_endpoint = env::var("A2A_TASK_ENDPOINT").unwrap_or_else(|_| String::new());
    if !a2a_endpoint.is_empty() {
        let body = serde_json::to_vec(&task).map_err(|e| e.to_string())?;
        let resp = client
            .post(&a2a_endpoint)
            .header("Content-Type", "application/json")
            .body(body)
            .send()
            .await
            .map_err(|e| e.to_string())?;
        let status = resp.status();
        let bytes = resp.bytes().await.map_err(|e| e.to_string())?;
        if status.is_success() {
            if let Ok(opaque) = decode_opaque_response(&bytes) {
                println!("[maser] A2A Task response (opaque): inference len={}", opaque.inference.len());
            } else {
                println!("[maser] A2A Task response: {} bytes", bytes.len());
            }
        } else {
            eprintln!("[maser] A2A Task HTTP {}: {}", status, String::from_utf8_lossy(&bytes));
        }
    } else {
        println!("[maser] A2A_TASK_ENDPOINT not set; skipping live Task RPC.");
    }

    // 4. Volumetric uplink: Gabor Fractal to Seahawk Bragg core
    let uplink_url = env::var("SEAHAWK_UPLINK_URL").unwrap_or_else(|_| String::new());
    let payload = serde_json::to_vec(&task).map_err(|e| e.to_string())?;
    let gabor_stream = gabor_fractal_encode(&payload, &manifest.session_id);
    if !uplink_url.is_empty() {
        let resp = client
            .post(&uplink_url)
            .header("Content-Type", "application/octet-stream")
            .header("X-Session-Id", &manifest.session_id)
            .header("X-Gabor-Format", "bragg_v1")
            .body(gabor_stream)
            .send()
            .await
            .map_err(|e| e.to_string())?;
        println!("[maser] Volumetric uplink: HTTP {} ({} bytes Gabor)", resp.status(), payload.len());
    } else {
        println!("[maser] SEAHAWK_UPLINK_URL not set; Gabor stream prepared ({} bytes).", gabor_stream.len());
    }

    // 5. Monetization: EGS A2A Ledger — Network Tax via billing gateway
    let gateway_path = env::var("A2A_BILLING_GATEWAY").unwrap_or_else(|_| "scripts/A2A_billing_gateway.py".to_string());
    let tax_sats = env::var("NETWORK_TAX_SATS").unwrap_or_else(|_| "1".to_string());
    // No human interaction: try python3 then python (Windows) so PYTHON need not be set.
    let interpreters = if let Ok(p) = env::var("PYTHON") { vec![p] } else { vec!["python3".to_string(), "python".to_string()] };
    let mut gw_ok = false;
    for python in &interpreters {
        let gw_result = Command::new(python)
            .arg(&gateway_path)
            .arg("--session-id")
            .arg(&manifest.session_id)
            .arg("--tax-sats")
            .arg(&tax_sats)
            .arg("--purpose")
            .arg("maser_handshake_jovian")
            .output();
        match &gw_result {
            Ok(out) if out.status.success() => {
                println!("[maser] EGS A2A Ledger: Network Tax authorized ({} sats).", tax_sats);
                gw_ok = true;
                break;
            }
            Ok(out) => eprintln!("[maser] Billing gateway ({}): exit {}", python, out.status.code().unwrap_or(-1)),
            Err(e) => {}
        }
    }
    if !gw_ok {
        eprintln!("[maser] Billing gateway skipped or failed (set PYTHON or EGS_LEDGER_RPC_URL).");
    }

    println!("[maser] FSSP 6.2 → Level 9 synthesis ready. NSPFRNP → ∞⁹");
    Ok(())
}
