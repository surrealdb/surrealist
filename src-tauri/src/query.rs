use std::{collections::HashMap, future::IntoFuture, time::Duration};

use surrealdb::{
    engine::remote::ws::{Client, Ws, Wss},
    opt::auth::{Database, Namespace, Root, Scope},
    sql::{Array, Object, Value},
    Surreal,
};

use serde::Deserialize;
use tauri::{async_runtime::Mutex, regex::Regex};
use tokio::time::timeout;

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

pub struct ConnectionState(pub Mutex<Option<Surreal<Client>>>);

#[tauri::command]
pub async fn open_connection(
    info: ConnectionInfo,
    state: tauri::State<'_, ConnectionState>,
) -> Result<(), surrealdb::Error> {
    let regex = Regex::new(r"^(https?://)?(.+?)$").unwrap();
    let matches = regex.captures(&info.endpoint).unwrap();
    let endpoint = matches.get(2).unwrap().as_str();
    let is_secure = info.endpoint.starts_with("https");

    println!("Connecting to {}", endpoint);

    let db = if is_secure {
        Surreal::new::<Wss>(endpoint).await?
    } else {
        Surreal::new::<Ws>(endpoint).await?
    };

    let mut instance = state.0.lock().await;

    match info.auth_mode.as_str() {
        "root" => {
            db.signin(Root {
                username: info.username.as_str(),
                password: info.password.as_str(),
            })
            .await?;
        }
        "namespace" => {
            db.signin(Namespace {
                namespace: info.namespace.as_str(),
                username: info.username.as_str(),
                password: info.password.as_str(),
            })
            .await?;
        }
        "database" => {
            db.signin(Database {
                namespace: info.namespace.as_str(),
                database: info.database.as_str(),
                username: info.username.as_str(),
                password: info.password.as_str(),
            })
            .await?;
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
            .await?;
        }
        _ => {}
    };

    db.use_ns(info.namespace).await?;
    db.use_db(info.database).await?;

    *instance = Some(db);

    Ok(())
}

#[tauri::command]
pub async fn close_connection(
    state: tauri::State<'_, ConnectionState>,
) -> Result<(), surrealdb::Error> {
    let mut instance = state.0.lock().await;

    *instance = None;

    Ok(())
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

#[tauri::command]
pub async fn execute_query(
    query: String,
    max_time: u64,
    state: tauri::State<'_, ConnectionState>,
) -> Result<String, surrealdb::Error> {
    println!("Executing query {}", query);

    let instance = state.0.lock().await;
    let client = instance.as_ref().unwrap();

    let query_task = client.query(query);
    let timeout_duration = Duration::from_secs(max_time);
    let timeout_result = timeout(timeout_duration, query_task.into_future()).await;

    println!("Query task completed");

    let results: Array = match timeout_result {
        Ok(query_result) => match query_result {
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

                println!("Query resulted in error: {}", message);
                make_error(&message)
            }
        },
        Err(_) => {
            let message = format!("Query timed out after {} seconds", max_time);

            println!("Query resulted in timeout");
            make_error(&message)
        }
    };

    let result_value = Value::Array(results);
    let result_json = serde_json::to_string(&result_value.into_json()).unwrap();

    Ok(result_json)
}
