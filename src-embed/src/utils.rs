use std::{error::Error, time::Duration};

use wasm_bindgen::JsValue;
use wasm_bindgen_futures::js_sys::{Array, Object, Reflect};

/// Utility for wrapping a SDB error into a JS value
pub fn to_js_err(err: surrealdb::Error) -> JsValue {
    JsValue::from_str(&err.to_string())
}

/// Convert an Error to a JSON value
pub fn error_to_js(err: impl Error) -> JsValue {
    serde_json::to_string(&err.to_string()).unwrap().into()
}

/// Fake an error response
pub fn make_error(err: impl Error) -> Array {
    let results = Array::new();
    let entry = Object::new();

    Reflect::set(&entry, &"success".into(), &false.into()).unwrap();
    Reflect::set(&entry, &"execution_time".into(), &format!("{:?}", Duration::ZERO).into()).unwrap();
    Reflect::set(&entry, &"result".into(), &error_to_js(err)).unwrap();

    results.push(&entry);

    results
}
