use std::path::PathBuf;

use tauri::api::path::config_dir;

pub fn get_data_directory() -> PathBuf {
    let mut config_path = config_dir().expect("data directory should be resolvable");

    config_path.push("SurrealDB");
    config_path.push("Surrealist");

    config_path
}
