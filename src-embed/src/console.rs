use wasm_bindgen::prelude::*;

#[wasm_bindgen]
extern "C" {

    #[wasm_bindgen(js_namespace = console)]
    pub fn log(s: &str);

    #[wasm_bindgen(js_namespace = console, js_name = log)]
    pub fn log_many(a: &str, b: &str);

}

macro_rules! console_log {
    ($($t:tt)*) => (crate::console::log(&format_args!($($t)*).to_string()))
}
