use serde::{Deserialize, Serialize};

#[derive(Deserialize)]
pub struct ScopeField {
    pub subject: String,
    pub value: String,
}

#[derive(Deserialize)]
pub struct ConnectionInfo {
    pub namespace: String,
    pub database: String,
    pub endpoint: String,
    pub username: String,
    pub password: String,
    pub auth_mode: String,
    pub scope: String,
    pub scope_fields: Vec<ScopeField>,
}

#[derive(Serialize)]
pub struct SurrealVersion {
    pub major: u64,
    pub minor: u64,
    pub patch: u64,
}