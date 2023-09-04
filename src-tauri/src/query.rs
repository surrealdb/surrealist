use std::collections::HashMap;

use surrealdb::{
    engine::remote::ws::{Client, Ws, Wss},
    opt::auth::{Database, Namespace, Root, Scope},
    sql::{Array, Object, Value},
    Surreal,
};

use serde::Deserialize;
use tauri::{async_runtime::Mutex, regex::Regex};

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

#[tauri::command]
pub async fn execute_query(
    query: String,
    state: tauri::State<'_, ConnectionState>,
) -> Result<String, surrealdb::Error> {
    println!("Executing query {}", query);

    let instance = state.0.lock().await;
    let client = instance.as_ref().unwrap();

    let query_result = client.query(query).await;

    let results: Array = match query_result {
        Ok(mut response) => {
            let statement_count = response.num_statements();

            let mut results = Array::with_capacity(statement_count);
            let errors = response.take_errors();

            for i in 0..statement_count {
                let mut entry = Object::default();
                let error = errors.get(&i);

                entry.insert("time".to_owned(), Value::from(""));

                match error {
                    Some(error) => {
                        let message = Value::from(error.to_string());

                        entry.insert("detail".to_owned(), message);
                        entry.insert("status".to_owned(), Value::from("ERR"));
                    }
                    None => {
                        let data: Value = response.take(i).unwrap();

                        entry.insert("result".to_owned(), data);
                        entry.insert("status".to_owned(), Value::from("OK"));
                    }
                };

                results.push(Value::Object(entry));
            }

            results
        }
        Err(error) => {
            let mut results = Array::with_capacity(1);
            let mut entry = Object::default();

            entry.insert("time".to_owned(), Value::from(""));
            entry.insert("detail".to_owned(), Value::from(error.to_string()));
            entry.insert("status".to_owned(), Value::from("ERR"));

            results.push(Value::Object(entry));

            results
        }
    };

    let result_value = Value::Array(results);
    let result_json = serde_json::to_string(&result_value.into_json()).unwrap();

    Ok(result_json)
}
