use wasm_bindgen::prelude::*;
use surrealdb::sql::Array;
use surrealdb::sql::Object;
use surrealdb::sql::Value;
use once_cell::sync::Lazy;
use regex::Regex;
use serde_wasm_bindgen::{from_value, to_value};
use std::collections::HashMap;
use tokio::sync::RwLock;

use surrealdb::{
    engine::any::{connect, Any},
    opt::auth::{Database, Namespace, Root, Scope},
    sql::json,
    Surreal,
};

use crate::types::ConnectionInfo;
use crate::types::SurrealVersion;
use crate::utils::make_error;
use crate::utils::to_js_err;

static SURREAL: Lazy<RwLock<Option<Surreal<Any>>>> = Lazy::new(|| RwLock::new(None));

#[wasm_bindgen]
pub async fn open_connection(details: JsValue) -> Result<(), JsValue> {
    let mut instance = SURREAL.write().await;

    let info: ConnectionInfo = from_value(details).expect("connection info should be valid");
    let endpoint = format!("{}://{}", info.protocol, info.hostname);

    console_log!("Connecting to {}", endpoint);

    let db = connect(endpoint).await.map_err(to_js_err)?;

    match info.auth_mode.as_str() {
        "root" => {
            db.signin(Root {
                username: info.username.as_str(),
                password: info.password.as_str(),
            })
            .await
            .map_err(to_js_err)?;
        }
        "namespace" => {
            db.signin(Namespace {
                namespace: info.namespace.as_str(),
                username: info.username.as_str(),
                password: info.password.as_str(),
            })
            .await
            .map_err(to_js_err)?;
        }
        "database" => {
            db.signin(Database {
                namespace: info.namespace.as_str(),
                database: info.database.as_str(),
                username: info.username.as_str(),
                password: info.password.as_str(),
            })
            .await
            .map_err(to_js_err)?;
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
            .map_err(to_js_err)?;
        }
        _ => {}
    };

    db.use_ns(info.namespace).await.map_err(to_js_err)?;
    db.use_db(info.database).await.map_err(to_js_err)?;

    *instance = Some(db);

    Ok(())
}

#[wasm_bindgen]
pub async fn close_connection() {
    let mut instance = SURREAL.write().await;

    *instance = None;
}

#[wasm_bindgen]
pub async fn query_version() -> Option<JsValue> {
    console_log!("Querying database version");

    let container = SURREAL.read().await;

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
pub async fn execute_query(query: String, params: String) -> String {
    let container = SURREAL.read().await;

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

    let response = builder.with_stats().await;

    console_log!(
        "Received response from database, success: {}",
        response.is_ok()
    );

    let results: Array = match response {
        Ok(mut response) => {
            let statement_count = response.num_statements();

            let mut results = Array::with_capacity(statement_count);
            let errors = response.take_errors();

            for i in 0..statement_count {
                let mut entry = Object::default();
                let error = errors.get(&i);
                let (result, status, stats) = match error {
                    Some((stats, error)) => {
                        (Value::from(error.to_string()), Value::from("ERR"), *stats)
                    }
                    None => {
                        let (stats, res) = response.take::<Value>(i).unwrap();
                        (res.unwrap(), Value::from("OK"), stats)
                    }
                };

                entry.insert("result".to_owned(), result);
                entry.insert("status".to_owned(), status);
                if let Some(time) = stats.execution_time {
                    entry.insert("time".to_owned(), Value::Duration(time.into()));
                };

                results.push(Value::Object(entry));
            }

            results
        }
        Err(error) => {
            let message = error.to_string();

            console_log!("Query resulted in error: {}", message);
            make_error(&message)
        }
    };

    let result_value = Value::Array(results);
    let result_json = serde_json::to_string(&result_value.into_json()).unwrap();

    result_json
}
