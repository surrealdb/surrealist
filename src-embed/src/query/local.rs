use wasm_bindgen::prelude::*;
use once_cell::sync::Lazy;
use surrealdb::engine::local::{Db, Mem};
use serde_wasm_bindgen::from_value;
use surrealdb::{Surreal, sql::json};
use tokio::sync::RwLock;
use crate::query::{ConnectionInfo, process_result, wrap_err};

static DATABASE: Lazy<RwLock<Option<Surreal<Db>>>> = Lazy::new(|| RwLock::new(None));

#[wasm_bindgen]
pub async fn execute_local_query(details: JsValue, query: String, params: String) -> Result<String, JsValue> {
    let mut instance = DATABASE.write().await;

    if instance.is_none() {
        let surreal = Surreal::new::<Mem>(()).await.expect("local database to initialize");

        *instance = Some(surreal);

        console_log!("Initialized local database");
    }

    console_log!("Executing local query {}", query);

    let database = instance.as_ref().unwrap();
    let info: ConnectionInfo = from_value(details).expect("connection info should be valid");

    database.use_ns(info.namespace).use_db(info.database).await.map_err(wrap_err)?;

    let mut builder = database.query(query);

    if let Ok(vars) = json(&params) {
        builder = builder.bind(vars);
    } else {
        console_log!("Failed to parse query variables");
    }

    let query_task = builder.await;

    console_log!(
        "Received response from database, success: {}",
        query_task.is_ok()
    );

    let result = process_result(query_task);

    Ok(result)
}