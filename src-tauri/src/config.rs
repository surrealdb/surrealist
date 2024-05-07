use std::{
    fs::{self, File},
    io::{Read, Write},
    path::PathBuf,
};

use crate::helpers::get_data_directory;
use tauri::Manager;

const DEFAULT_CONFIG: &str = "{}";

fn get_config_path(app: &tauri::AppHandle) -> PathBuf {
    let mut config_path = get_data_directory(app);
    config_path.push("config.json");
    config_path
}

fn get_legacy_config_path(app: &tauri::AppHandle) -> PathBuf {
    let mut config_path = app.path().config_dir().expect("config directory should be resolvable");
    config_path.push("surrealist.json");
    config_path
}

fn get_legacy_backup_path(app: &tauri::AppHandle) -> PathBuf {
    let mut config_path = get_data_directory(app);
    config_path.push("config-v1.json");
    config_path
}

fn write_config(app: &tauri::AppHandle, config: &str) {
	let config_path = get_config_path(app);
    let parent = config_path.parent().unwrap();

    fs::create_dir_all(parent).expect("config directory should be writable");

    let mut write_op = File::create(config_path).unwrap();

    write_op
        .write_all(config.as_bytes())
        .expect("config should be writable");
}

#[tauri::command]
pub fn load_config(app: tauri::AppHandle) -> String {
    let config_path = get_config_path(&app);

    // Attempt to read the config file
    let read_op = File::open(config_path);
    let mut buffer = String::new();

    match read_op {
        Ok(mut file) => {
            file.read_to_string(&mut buffer)
                .expect("config should be readable");
        }
        Err(_) => {
            write_config(&app, DEFAULT_CONFIG);
            buffer = DEFAULT_CONFIG.to_string();
        }
    }

    buffer
}

#[tauri::command]
pub fn load_legacy_config(app: tauri::AppHandle) -> String {
    let config_path = get_legacy_config_path(&app);

    // Attempt to read the config file
    let read_op = File::open(config_path);
    let mut buffer = String::new();

    match read_op {
        Ok(mut file) => {
            file.read_to_string(&mut buffer)
                .expect("legacy config should be readable");
        }
        Err(_) => {
            write_config(&app, DEFAULT_CONFIG);
            buffer = DEFAULT_CONFIG.to_string();
        }
    }

    buffer
}

#[tauri::command]
pub fn save_config(app: tauri::AppHandle, config: &str) {
   write_config(&app, config)
}

#[tauri::command]
pub fn has_legacy_config(app: tauri::AppHandle) -> bool {
    get_legacy_config_path(&app).exists()
}

#[tauri::command]
pub fn complete_legacy_migrate(app: tauri::AppHandle) {
    let legacy = get_legacy_config_path(&app);
    let target = get_legacy_backup_path(&app);

    fs::rename(legacy, target).expect("legacy config could not be moved");
}
