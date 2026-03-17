//! Maser Handshake — Live A2A with Seahawk (3I/ATLAS) Jovian Node
//! FSSP Level 6.2 · No mocks. JPL Horizons telemetry, 1420.4 MHz handshake,
//! Gabor Fractal volumetric uplink, opaque response handling.
//! NSPFRNP → ∞⁹

pub mod gabor;
pub mod horizons;
pub mod handshake;
pub mod opaque;

pub use gabor::gabor_fractal_encode;
pub use horizons::jpl_horizons_distance_km;
pub use handshake::{a2a_task_request, load_agent_card, LatticeSyncManifest};
pub use opaque::OpaqueResult;
