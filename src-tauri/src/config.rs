use std::{
    fs::{self, File},
    io::{Read, Write},
};

use crate::paths::{get_config_path, get_legacy_config_backup_path, get_legacy_config_path};

const DEFAULT_CONFIG: &str = "{}";

fn write_config(config: &str) {
    let config_path = get_config_path();
    let parent = config_path.parent().unwrap();

    fs::create_dir_all(parent).expect("config directory should be writable");

    let mut write_op = File::create(config_path).unwrap();
    let config_json_value: serde_json::Value = serde_json::from_str(config).unwrap();
    let mut pretty_config = serde_json::to_string_pretty(&config_json_value).unwrap();

    pretty_config.push_str("\n");

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
            write_config(DEFAULT_CONFIG);
            buffer = DEFAULT_CONFIG.to_string();
        }
    }

    buffer
}

#[tauri::command]
pub fn load_legacy_config() -> String {
    let config_path = get_legacy_config_path();

    // Attempt to read the config file
    let read_op = File::open(config_path);
    let mut buffer = String::new();

    match read_op {
        Ok(mut file) => {
            file.read_to_string(&mut buffer)
                .expect("legacy config should be readable");
        }
        Err(_) => {
            write_config(DEFAULT_CONFIG);
            buffer = DEFAULT_CONFIG.to_string();
        }
    }

    buffer
}

#[tauri::command]
pub fn save_config(config: &str) {
    write_config(config)
}

#[tauri::command]
pub fn has_legacy_config() -> bool {
    get_legacy_config_path().exists()
}

#[tauri::command]
pub fn complete_legacy_migrate() {
    let legacy = get_legacy_config_path();
    let target = get_legacy_config_backup_path();

    fs::rename(legacy, target).expect("legacy config could not be moved");
}
