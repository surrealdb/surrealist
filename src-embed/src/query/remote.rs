use crate::query::{make_error, process_result, wrap_err, ConnectionInfo};
use once_cell::sync::Lazy;
use regex::Regex;
use serde::Serialize;
use serde_wasm_bindgen::{from_value, to_value};
use std::collections::HashMap;
use tokio::sync::RwLock;
use wasm_bindgen::prelude::*;

use surrealdb::{
    engine::remote::ws::{Client, Ws, Wss},
    opt::auth::{Database, Namespace, Root, Scope},
    sql::{json, Value},
    Surreal,
};

static CLIENT: Lazy<RwLock<Option<Surreal<Client>>>> = Lazy::new(|| RwLock::new(None));

#[derive(Serialize)]
pub struct SurrealVersion {
    pub major: u64,
    pub minor: u64,
    pub patch: u64,
}

#[wasm_bindgen]
pub async fn open_connection(details: JsValue) -> Result<(), JsValue> {
    let mut instance = CLIENT.write().await;

    let info: ConnectionInfo = from_value(details).expect("connection info should be valid");
    let regex = Regex::new(r"^(https?://)?(.+?)$").unwrap();
    let matches = regex.captures(&info.endpoint).unwrap();
    let endpoint = matches.get(2).unwrap().as_str();
    let is_secure = info.endpoint.starts_with("https");

    console_log!("Connecting to {}", endpoint);

    let db = if is_secure {
        Surreal::new::<Wss>(endpoint).await.map_err(wrap_err)?
    } else {
        Surreal::new::<Ws>(endpoint).await.map_err(wrap_err)?
    };

    if instance.is_none() {
        *instance = None;
    }

    match info.auth_mode.as_str() {
        "root" => {
            db.signin(Root {
                username: info.username.as_str(),
                password: info.password.as_str(),
            })
            .await
            .map_err(wrap_err)?;
        }
        "namespace" => {
            db.signin(Namespace {
                namespace: info.namespace.as_str(),
                username: info.username.as_str(),
                password: info.password.as_str(),
            })
            .await
            .map_err(wrap_err)?;
        }
        "database" => {
            db.signin(Database {
                namespace: info.namespace.as_str(),
                database: info.database.as_str(),
                username: info.username.as_str(),
                password: info.password.as_str(),
            })
            .await
            .map_err(wrap_err)?;
        }
        "scope" => {
            let field_map = info
                .scope_fields
                .iter()
                .map(|field| (field.subject.as_str(), field.value.as_str()))
                .collect::<HashMap<&str, &str>>();

            db.signin(Scope {
                namespace: info.namespace.as_str(),
                database: info.database.as_str(),
                scope: info.scope.as_str(),
                params: field_map,
            })
            .await
            .map_err(wrap_err)?;
        }
        _ => {}
    };

    db.use_ns(info.namespace).await.map_err(wrap_err)?;
    db.use_db(info.database).await.map_err(wrap_err)?;

    *instance = Some(db);

    Ok(())
}

#[wasm_bindgen]
pub async fn close_connection() {
    let mut instance = CLIENT.write().await;

    *instance = None;
}

#[wasm_bindgen]
pub async fn query_version() -> Option<JsValue> {
    console_log!("Querying database version");

    let container = CLIENT.read().await;

    if container.is_none() {
        return None;
    }

    let client = container.as_ref().unwrap();
    let version = client.version().await;

    return match version {
        Ok(version) => {
            console_log!("Database version is {}", version.to_string());

            let semver = SurrealVersion {
                major: version.major,
                minor: version.minor,
                patch: version.patch,
            };

            match to_value(&semver) {
                Ok(value) => Some(value),
                Err(_) => None,
            }
        }
        Err(error) => {
            let message = error.to_string();

            console_log!("Query resulted in error: {}", message);
            None
        }
    };
}

#[wasm_bindgen]
pub async fn execute_remote_query(query: String, params: String) -> String {
    let container = CLIENT.read().await;

    if container.is_none() {
        let error = Value::Array(make_error("No connection open")).into_json();

        return serde_json::to_string(&error).unwrap();
    }

    console_log!("Executing remote query {}", query);

    let client = container.as_ref().unwrap();
    let mut builder = client.query(query);

    if let Ok(vars) = json(&params) {
        builder = builder.bind(vars);
    } else {
        console_log!("Failed to parse query variables");
    }

    let query_task = builder.with_stats().await;

    console_log!(
        "Received response from database, success: {}",
        query_task.is_ok()
    );

    process_result(query_task)
}
