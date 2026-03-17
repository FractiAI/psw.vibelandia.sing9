//! Opaque execution: return Seahawk high-density inference result;
//! internal Jovian processing state remains encrypted in node cryo-heatsink.

use base64::{engine::general_purpose::STANDARD as B64, Engine};
use serde::{Deserialize, Serialize};

/// Opaque result: only the inference payload is exposed; internal state is sealed.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OpaqueResult {
    /// High-density inference output (decoded for caller).
    pub inference: String,
    /// Sealed internal state (cryo-heatsink); do not decode in client.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub sealed_state: Option<String>,
}

/// Decode opaque response from Seahawk: extract inference, leave sealed_state as-is.
pub fn decode_opaque_response(body: &[u8]) -> Result<OpaqueResult, String> {
    let parsed: OpaqueResult = serde_json::from_slice(body).map_err(|e| e.to_string())?;
    Ok(parsed)
}
