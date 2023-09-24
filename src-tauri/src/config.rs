use std::{
    env,
    fs::{self, File},
    io::{Read, Write},
    path::PathBuf,
};
use tauri::api::path::{config_dir, home_dir};

const DEFAULT_CONFIG: &str = "{}";

fn get_legacy_config_path() -> PathBuf {
    let mut base_dir = home_dir().unwrap_or_else(|| PathBuf::from("."));

    base_dir.push(".surrealist.json");

    if base_dir.exists() {
        return base_dir;
    }

    let config_dir_result = env::var("XDG_CONFIG_HOME");

    match config_dir_result {
        Ok(value) => {
            let mut config = PathBuf::from(value);
            config.push("surrealist");
            config.push("config.json");
            config
        }
        Err(_) => base_dir,
    }
}

fn get_config_path() -> PathBuf {
    let mut config_path = config_dir().expect("Config directory should be resolvable");

    config_path.push("surrealist.json");
    config_path
}

#[tauri::command]
pub fn load_config() -> String {
    let legacy_path = get_legacy_config_path();
    let config_path = get_config_path();

    // Migrate the legacy config
    if legacy_path.exists() {
        fs::rename(&legacy_path, &config_path).expect("config to be migrated");
    }

    // Attempt to read the config file
    let read_op = File::open(&config_path);
    let mut buffer = String::new();

    match read_op {
        Ok(mut file) => {
            file.read_to_string(&mut buffer)
                .expect("config should be readable");
        }
        Err(_) => {
            save_config(DEFAULT_CONFIG);
            buffer = DEFAULT_CONFIG.to_string();
        }
    }

    buffer
}

#[tauri::command]
pub fn save_config(config: &str) {
    let config_path = get_config_path();
    let parent = config_path.parent().unwrap();

    fs::create_dir_all(parent).expect("config directory should be writable");

    let mut write_op = File::create(config_path).unwrap();

    write_op
        .write_all(config.as_bytes())
        .expect("config should be writable");
}
