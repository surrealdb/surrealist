use std::{
    fs::{self, copy, File},
    io::{Read, Write},
    path::PathBuf,
};

use crate::paths::{
    get_config_backup_path, get_config_path,
};

const DEFAULT_CONFIG: &str = "{}";

fn write_config(config: &str, path: PathBuf) {
    let parent = path.parent().unwrap();

    fs::create_dir_all(parent).expect("config directory should be writable");

    let mut write_op = File::create(path).unwrap();
    let config_json_value: serde_json::Value = serde_json::from_str(config).unwrap();
    let mut pretty_config = serde_json::to_string_pretty(&config_json_value).unwrap();

    pretty_config.push('\n');

    write_op
        .write_all(pretty_config.as_bytes())
        .expect("config should be writable");
}

#[tauri::command]
pub fn load_config() -> String {
    let config_path = get_config_path();

    // Attempt to read the config file
    let read_op = File::open(config_path);
    let mut buffer = String::new();

    match read_op {
        Ok(mut file) => {
            file.read_to_string(&mut buffer)
                .expect("config should be readable");
        }
        Err(_) => {
            write_config(DEFAULT_CONFIG, get_config_path());
            buffer = DEFAULT_CONFIG.to_string();
        }
    }

    buffer
}

#[tauri::command]
pub fn save_config(config: &str) {
    write_config(config, get_config_path())
}

#[tauri::command]
pub fn backup_config(config: &str, version: u32) {
    write_config(config, get_config_backup_path(version));
}

#[tauri::command]
pub fn has_config_backup(version: u32) -> bool {
    get_config_backup_path(version).exists()
}

#[tauri::command]
pub fn restore_config_backup(version: u32) -> Result<(), String> {
    let backup_path = get_config_backup_path(version);
    let config_path = get_config_path();

    if !backup_path.exists() {
        return Err("Backup does not exist".into());
    }

    match copy(backup_path, config_path) {
        Ok(_) => Ok(()),
        Err(_) => Err("Failed to restore config backup".into()),
    }
}