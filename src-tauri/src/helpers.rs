use std::path::PathBuf;

use tauri::Manager;

pub fn get_data_directory(app: &tauri::AppHandle) -> PathBuf {
    let mut config_path = app.path().config_dir().expect("data directory should be resolvable");

    config_path.push("SurrealDB");
    config_path.push("Surrealist");

    config_path
}