use std::panic;
use wasm_bindgen::prelude::*;

#[macro_use]
mod console;

mod query;
mod schema;

#[wasm_bindgen]
pub fn initialize_embed() {
    panic::set_hook(Box::new(console_error_panic_hook::hook));
}
