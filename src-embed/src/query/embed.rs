use wasm_bindgen::prelude::*;
use once_cell::sync::Lazy;
use surrealdb::engine::local::Mem;
use surrealdb::Surreal;
use tokio::sync::RwLock;

static DATABASE: Lazy<RwLock<Option<Surreal<Mem>>>> = Lazy::new(|| RwLock::new(None));

#[wasm_bindgen]
pub async fn start_embedded() -> Result<(), JsValue> {
    Ok(())
}

#[wasm_bindgen]
pub async fn stop_embedded() -> Result<(), JsValue> {
    Ok(())
}

#[wasm_bindgen]
pub async fn execute_embedded_query(query: String, params: String) -> String {
    "".into()
}