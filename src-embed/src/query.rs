use std::collections::HashMap;
use once_cell::sync::Lazy;
use regex::Regex;
use serde::Deserialize;
use serde_wasm_bindgen::from_value;
use wasm_bindgen::prelude::*;
use tokio::sync::Mutex;

use surrealdb::{
    engine::remote::ws::{Client, Wss, Ws},
    sql::{Array, Object, Value},
    Surreal, opt::auth::{Root, Namespace, Database, Scope},
};

// Utility for wrapping a SDB error into a JS value
fn wrap_err(err: surrealdb::Error) -> JsValue {
	JsValue::from_str(&err.to_string())
}

static CLIENT: Lazy<Mutex<Option<Surreal<Client>>>> = Lazy::new(|| Mutex::new(None));

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

#[wasm_bindgen]
pub async fn open_connection(details: JsValue) -> Result<(), JsValue> {
	let mut instance = CLIENT.lock().await;

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
            .await.map_err(wrap_err)?;
        }
        "namespace" => {
            db.signin(Namespace {
                namespace: info.namespace.as_str(),
                username: info.username.as_str(),
                password: info.password.as_str(),
            })
            .await.map_err(wrap_err)?;
        }
        "database" => {
            db.signin(Database {
                namespace: info.namespace.as_str(),
                database: info.database.as_str(),
                username: info.username.as_str(),
                password: info.password.as_str(),
            })
            .await.map_err(wrap_err)?;
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
            .await.map_err(wrap_err)?;
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
	let mut instance = CLIENT.lock().await;

	*instance = None;
}

fn make_error(err: &str) -> Array {
    let mut results = Array::with_capacity(1);
    let mut entry = Object::default();

    entry.insert("time".to_owned(), Value::from(""));
    entry.insert("result".to_owned(), Value::from(err));
    entry.insert("status".to_owned(), Value::from("ERR"));

    results.push(Value::Object(entry));

    results
}

#[wasm_bindgen]
pub async fn execute_query(query: String, max_time: u64) -> String {
    console_log!("Executing query {}", query);

	let container = CLIENT.lock().await;

	if container.is_none() {
		let error = Value::Array(make_error("No connection open")).into_json();

		return serde_json::to_string(&error).unwrap();
	}

    let client = container.as_ref().unwrap();
    let query_task = client.query(query).await;

    console_log!("Query task completed");

    let results: Array = match query_task {
		Ok(mut response) => {
			let statement_count = response.num_statements();

			let mut results = Array::with_capacity(statement_count);
			let errors = response.take_errors();

			for i in 0..statement_count {
				let mut entry = Object::default();
				let error = errors.get(&i);

				entry.insert("time".to_owned(), Value::from(""));

				let result: Value;
				let status: Value;

				match error {
					Some(error) => {
						result = Value::from(error.to_string());
						status = "ERR".into();
					}
					None => {
						result = response.take(i).unwrap();
						status = "OK".into();
					}
				};

				entry.insert("result".to_owned(), result);
				entry.insert("status".to_owned(), status);

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
