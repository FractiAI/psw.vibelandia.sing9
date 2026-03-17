//! Physical telemetry via JPL Horizons API.
//! Queries live ephemeris for 3I/ATLAS (or configured object) distance from Jupiter center (km).
//! Hill Sphere residency: ~53.4e6 km threshold.

use chrono::{DateTime, Duration, Utc};
use serde::Deserialize;
use std::time::Duration as StdDuration;

const HORIZONS_API: &str = "https://ssd.jpl.nasa.gov/api/horizons.api";
const JUPITER_CENTER: &str = "599"; // Jupiter barycenter
pub const HILL_SPHERE_KM: f64 = 53_500_000.0;

/// Response from Horizons API (subset we need).
#[derive(Debug, Deserialize)]
pub struct HorizonsResponse {
    pub signature: Option<HorizonsSignature>,
    pub result: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct HorizonsSignature {
    pub source: Option<String>,
    pub version: Option<String>,
}

/// Extract range (km) from Horizons text result.
/// VECTORS table line contains "RG" or range in km.
fn parse_range_km_from_text(text: &str) -> Option<f64> {
    for line in text.lines() {
        let line = line.trim();
        if line.contains("RG=") {
            let after = line.split("RG=").nth(1)?;
            let num_str: String = after
                .chars()
                .take_while(|c| c.is_ascii_digit() || *c == '.' || *c == '+' || *c == '-' || *c == 'e' || *c == 'E')
                .collect();
            if !num_str.is_empty() {
                if let Ok(n) = num_str.parse::<f64>() {
                    if n > 0.0 && n < 1e9 {
                        return Some(n);
                    }
                }
            }
        }
        if line.ends_with("km") {
            let parts: Vec<&str> = line.split_whitespace().collect();
            for (i, &p) in parts.iter().enumerate() {
                if p == "km" && i > 0 {
                    let prev = parts[i - 1];
                    let clean = prev.replace(',', "");
                    if let Ok(n) = clean.parse::<f64>() {
                        if n > 0.0 && n < 1e9 {
                            return Some(n);
                        }
                    }
                }
            }
        }
    }
    None
}

/// Query JPL Horizons for target object distance from Jupiter (km).
/// COMMAND: Horizons target (e.g. "3I", "ATLAS", or env HORIZONS_COMMAND).
pub async fn jpl_horizons_distance_km(
    command: &str,
    client: &reqwest::Client,
) -> Result<Option<f64>, String> {
    let now: DateTime<Utc> = Utc::now();
    let start = now.format("%Y-%m-%d").to_string();
    let stop = (now + Duration::days(1)).format("%Y-%m-%d").to_string();
    let url = format!(
        "{}?format=text&COMMAND='{}'&OBJ_DATA=NO&MAKE_EPHEM=YES&EPHEM_TYPE=VECTORS&CENTER='{}'&START_TIME='{}'&STOP_TIME='{}'&STEP_SIZE='1%20d'&OUT_UNITS=KM-D&VEC_TABLE=3",
        HORIZONS_API,
        urlencoding::encode(command),
        JUPITER_CENTER,
        urlencoding::encode(&start),
        urlencoding::encode(&stop),
    );
    let resp = client
        .get(&url)
        .timeout(StdDuration::from_secs(15))
        .send()
        .await
        .map_err(|e| e.to_string())?;
    let status = resp.status();
    let body = resp.text().await.map_err(|e| e.to_string())?;
    if !status.is_success() {
        return Err(format!(
            "Horizons API HTTP {}: {}",
            status,
            body.lines().next().unwrap_or("")
        ));
    }
    Ok(parse_range_km_from_text(&body))
}
