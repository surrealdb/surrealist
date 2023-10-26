pub mod remote;
pub mod embed;

use wasm_bindgen::prelude::*;
use surrealdb::sql::Array;
use surrealdb::sql::Object;
use surrealdb::sql::Value;

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