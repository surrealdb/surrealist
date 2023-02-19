#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

mod config;
mod schema;

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
			config::load_config,
			config::save_config,
			schema::extract_scope_fields
		])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
