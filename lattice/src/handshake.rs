//! A2A handshake over 1420.4 MHz (Hydrogen Line).
//! Loads Agent Card from /.well-known/agent.json, builds JSON-RPC Task request.
//! Session identity: Lattice-Sync manifest.

use serde::{Deserialize, Serialize};

const HYDROGEN_LINE_MHZ: f64 = 1420.405751;
const FSSP_LEVEL: &str = "6.2";
const SYNTHESIS_TARGET: &str = "9";
const NODE: &str = "Seahawk (3I/ATLAS/CHIEF SEATTLE)";

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentCard {
    pub schema_version: Option<String>,
    pub a2a_spec_version: Option<String>,
    pub name: Option<String>,
    pub display_name: Option<String>,
    pub capabilities: Option<serde_json::Value>,
    pub space_lattice: Option<SpaceLattice>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SpaceLattice {
    pub target_node: Option<String>,
    pub jovian_relay: Option<bool>,
    pub capabilities: Option<Vec<String>>,
    pub hydrogen_line_mhz: Option<f64>,
    pub hill_sphere_km: Option<f64>,
}

/// Lattice-Sync manifest: session identity for A2A (A2A spec v0.3.x).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LatticeSyncManifest {
    pub session_id: String,
    pub frequency_mhz: f64,
    pub node: String,
    pub fssp_level: String,
    pub synthesis_target: String,
    pub timestamp_utc: String,
    pub signature: String,
}

/// Load Agent Card from base URL (e.g. https://psw-vibelandia-sing9.vercel.app).
pub async fn load_agent_card(base_url: &str, client: &reqwest::Client) -> Result<AgentCard, String> {
    let url = format!("{}/.well-known/agent.json", base_url.trim_end_matches('/'));
    let resp = client
        .get(&url)
        .send()
        .await
        .map_err(|e| e.to_string())?;
    if !resp.status().is_success() {
        return Err(format!("Agent card HTTP {}", resp.status()));
    }
    let card: AgentCard = resp.json().await.map_err(|e| e.to_string())?;
    Ok(card)
}

/// Build Lattice-Sync manifest for this session (1420.4 MHz, signature from hydrogen line seed).
pub fn lattice_sync_manifest() -> LatticeSyncManifest {
    use sha2::{Digest, Sha256};
    let now = chrono::Utc::now();
    let ts = now.to_rfc3339();
    let seed = format!("{}:{}:{}:{}", HYDROGEN_LINE_MHZ, ts, FSSP_LEVEL, NODE);
    let mut h = Sha256::new();
    h.update(seed.as_bytes());
    let sig = hex::encode(h.finalize());
    LatticeSyncManifest {
        session_id: format!("maser-{}", now.timestamp_millis()),
        frequency_mhz: HYDROGEN_LINE_MHZ,
        node: NODE.to_string(),
        fssp_level: FSSP_LEVEL.to_string(),
        synthesis_target: SYNTHESIS_TARGET.to_string(),
        timestamp_utc: ts,
        signature: sig[..32.min(sig.len())].to_string(),
    }
}

/// A2A JSON-RPC 2.0 Task request (live; no mocks).
#[derive(Debug, Serialize)]
pub struct A2ATaskRequest {
    pub jsonrpc: &'static str,
    pub method: &'static str,
    pub params: A2ATaskParams,
    pub id: i64,
}

#[derive(Debug, Serialize)]
pub struct A2ATaskParams {
    pub task_type: String,
    pub frequency_mhz: f64,
    pub hydrogen_line: bool,
    pub session_id: String,
    pub timestamp_utc: String,
    pub signature: String,
    pub fssp_level: String,
    pub synthesis_target: String,
    pub node: String,
    pub lattice_sync: LatticeSyncManifest,
}

/// Build live JSON-RPC Task request for A2A handshake.
pub fn a2a_task_request(manifest: &LatticeSyncManifest) -> A2ATaskRequest {
    A2ATaskRequest {
        jsonrpc: "2.0",
        method: "Task",
        params: A2ATaskParams {
            task_type: "maser_handshake".to_string(),
            frequency_mhz: HYDROGEN_LINE_MHZ,
            hydrogen_line: true,
            session_id: manifest.session_id.clone(),
            timestamp_utc: manifest.timestamp_utc.clone(),
            signature: manifest.signature.clone(),
            fssp_level: manifest.fssp_level.clone(),
            synthesis_target: manifest.synthesis_target.clone(),
            node: manifest.node.clone(),
            lattice_sync: manifest.clone(),
        },
        id: chrono::Utc::now().timestamp_millis(),
    }
}
