//! Gabor Fractal encoding: holographic interference pattern for Seahawk 3D Bragg Grating core.
//! Encodes payload as binary stream (not flat text); compatible with volumetric uplink.

use sha2::{Digest, Sha256};
use std::io::Write;

/// Gabor-style fractal seed from 1420.4 MHz and session.
fn gabor_seed(session_id: &str, layer: u32) -> [u8; 32] {
    let mut h = Sha256::new();
    h.update(b"gabor_fractal_v1");
    h.update(1420_405_751u64.to_be_bytes());
    h.update(session_id.as_bytes());
    h.update(layer.to_be_bytes());
    let mut out = [0u8; 32];
    out.copy_from_slice(h.finalize().as_slice());
    out
}

/// Encode payload into Gabor Fractal binary stream (holographic interference pattern).
/// Output is a direct binary stream for Seahawk Bragg core: header + fractal-modulated payload.
pub fn gabor_fractal_encode(payload: &[u8], session_id: &str) -> Vec<u8> {
    const MAGIC: &[u8] = b"GBR1"; // Gabor Bragg v1
    let mut out = Vec::with_capacity(MAGIC.len() + 4 + 4 + payload.len());
    out.write_all(MAGIC).unwrap();
    out.write_all(&(session_id.len() as u32).to_be_bytes()).unwrap();
    out.write_all(&(payload.len() as u32).to_be_bytes()).unwrap();
    out.write_all(session_id.as_bytes()).unwrap();
    let mut layer = 0u32;
    for chunk in payload.chunks(32) {
        let seed = gabor_seed(session_id, layer);
        let mut encoded = Vec::with_capacity(chunk.len());
        for (i, &b) in chunk.iter().enumerate() {
            encoded.push(b.wrapping_add(seed[i % 32]));
        }
        out.write_all(&encoded).unwrap();
        layer = layer.wrapping_add(1);
    }
    out
}
