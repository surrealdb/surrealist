use surrealdb::sql::{Array, Object, Value};
use wasm_bindgen::JsValue;

/// Utility for wrapping a SDB error into a JS value
pub fn to_js_err(err: surrealdb::Error) -> JsValue {
    JsValue::from_str(&err.to_string())
}

/// Fake an error response
pub fn make_error(err: &str) -> Array {
    let mut results = Array::with_capacity(1);
    let mut entry = Object::default();

    entry.insert("time".to_owned(), Value::from(""));
    entry.insert("result".to_owned(), Value::from(err));
    entry.insert("status".to_owned(), Value::from("ERR"));

    results.push(Value::Object(entry));

    results
}