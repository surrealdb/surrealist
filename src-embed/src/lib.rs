use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn hello_world() -> String {
	return "Hello, world!".to_string();
}