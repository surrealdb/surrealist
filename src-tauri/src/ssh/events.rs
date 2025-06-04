use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
pub struct UnknownHostFingerprintAsk {
    pub fingerprints: Vec<String>,
}

#[derive(Serialize, Deserialize)]
pub struct UnknownHostFingerprintReply {
    pub fingerprint: String,
}
