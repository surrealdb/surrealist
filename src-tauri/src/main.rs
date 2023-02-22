#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use database::DatabaseState;

mod config;
mod schema;
mod database;

fn main() {
    tauri::Builder::default()
		.manage(DatabaseState(Default::default()))
        .invoke_handler(tauri::generate_handler![
			config::load_config,
			config::save_config,
			schema::extract_scope_fields,
			database::start_database,
			database::stop_database
		])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
