pub mod local;
pub mod remote;

use serde::Deserialize;
use surrealdb::method::WithStats;
use surrealdb::sql::Array;
use surrealdb::sql::Object;
use surrealdb::sql::Value;
use surrealdb::Response;
use wasm_bindgen::prelude::*;

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

// Utility for wrapping a SDB error into a JS value
fn wrap_err(err: surrealdb::Error) -> JsValue {
    JsValue::from_str(&err.to_string())
}

// Fake an error response
fn make_error(err: &str) -> Array {
    let mut results = Array::with_capacity(1);
    let mut entry = Object::default();

    entry.insert("time".to_owned(), Value::from(""));
    entry.insert("result".to_owned(), Value::from(err));
    entry.insert("status".to_owned(), Value::from("ERR"));

    results.push(Value::Object(entry));

    results
}

fn process_result(response: Result<WithStats<Response>, surrealdb::Error>) -> String {
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
