use std::panic;
use wasm_bindgen::prelude::*;

mod query;
mod schema;

#[wasm_bindgen]
pub fn initialize() {
	panic::set_hook(Box::new(console_error_panic_hook::hook));
}