use futures::StreamExt;
use once_cell::sync::Lazy;
use serde_wasm_bindgen::{from_value, to_value};
use tokio::sync::Mutex;
use wasm_bindgen_futures::js_sys::Array;
use wasm_bindgen_futures::js_sys::Function;
use wasm_bindgen_futures::js_sys::Object;
use wasm_bindgen_futures::js_sys::Reflect;
use std::collections::HashMap;
use std::time::Duration;
use surrealdb::sql::Value;
use tokio::sync::RwLock;
use wasm_bindgen::prelude::*;

use surrealdb::{
    engine::any::{connect, Any},
    opt::auth::{Database, Namespace, Root, Scope},
    sql::json,
    Surreal,
};

use crate::types::ConnectionInfo;
use crate::types::LiveQuery;
use crate::types::SurrealVersion;
use crate::utils::error_to_js;
use crate::utils::make_error;
use crate::utils::to_js_err;

static SURREAL: Lazy<RwLock<Option<Surreal<Any>>>> = Lazy::new(|| RwLock::new(None));
static LIVE_QUERIES: Lazy<Mutex<HashMap<String, LiveQuery>>> = Lazy::new(|| Mutex::new(HashMap::new()));

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
pub async fn execute_query(id: Option<String>, query: String, params: String) -> Option<Array> {
    let container = SURREAL.read().await;
    let mut builder = container.as_ref()?.query(query);
    let mut queries = LIVE_QUERIES.lock().await;

    if let Some(id) = id.as_ref() {
        if let Some(live) = queries.remove(id) {
            live.cancel();
        }
    }

    if let Ok(vars) = json(&params) {
        builder = builder.bind(vars);
    } else {
        console_log!("Failed to parse query variables");
    }

    let response = builder.with_stats().await;

    return match response {
        Ok(mut response) => {
            let statement_count = response.num_statements();
            let results = Array::new_with_length(statement_count as u32);

            for i in 0..statement_count {
                let object = Object::new();
                let (stats, res) = response.take::<Value>(i).unwrap();
                let time = stats.execution_time.unwrap_or_else(|| Duration::default());

                Reflect::set(&object, &"success".into(), &res.is_ok().into()).unwrap();
                Reflect::set(&object, &"execution_time".into(), &format!("{:?}", time).into()).unwrap();
                Reflect::set(&object, &"result".into(), &match res {
                    Ok(value) => serde_json::to_string(&value.into_json()).unwrap().into(),
                    Err(error) => error_to_js(error),
                }).unwrap();

                results.set(i as u32, object.into());
            }

            if let Some(id) = id {
                match response.into_inner().stream::<Value>(()) {
                    Ok(stream) => {
                        queries.insert(id, LiveQuery::new(stream));
                    },
                    Err(error) => {
                        console_log!("Failed to get live query stream: {:?}", error.to_string());
                    }
                };
            }
            
            Some(results)
        }
        Err(error) => {
            Some(make_error(error))
        }
    };
}

#[wasm_bindgen]
pub async fn watch_live_query(id: String, on_message: Function) -> Option<JsValue> {
    
    let mut stream = {
        let mut queries = LIVE_QUERIES.lock().await;
        queries.get_mut(&id)?.into_inner()?
    };

    while let Some(value) = stream.next().await {
        let data = serde_json::to_string(&value.data.into_json()).unwrap().into();
        let action = match value.action {
            surrealdb::Action::Create => "create",
            surrealdb::Action::Update => "update",
            surrealdb::Action::Delete => "delete",
            _ => unreachable!(),
        };
        
        let payload = Object::new();

        Reflect::set(&payload, &"queryId".into(), &value.query_id.to_string().into()).unwrap();
        Reflect::set(&payload, &"action".into(), &action.into()).unwrap();
        Reflect::set(&payload, &"data".into(), &data).unwrap();

        on_message.call1(&JsValue::NULL, &payload).unwrap();
    }

    LIVE_QUERIES.lock().await.remove(&id);

    Some(JsValue::NULL)
}

#[wasm_bindgen]
pub async fn cancel_live_query(id: String) {
    let mut queries = LIVE_QUERIES.lock().await;

    if let Some(live) = queries.remove(&id) {
        live.cancel();
    }
}