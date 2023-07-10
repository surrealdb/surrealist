use std::{
    env,
    fs::{self, File},
    io::{Read, Write},
    path::{Path, PathBuf},
};
use tauri::api::path::home_dir;

const DEFAULT_CONFIG: &str = "{}";

fn get_config_path() -> String {
    let mut base_dir = home_dir().unwrap_or_else(|| PathBuf::from("."));

    base_dir.push(".surrealist.json");
    if base_dir.exists() {
        return base_dir.to_str().unwrap().to_string();
    }

    let config_dir_result = env::var("XDG_CONFIG_HOME");
    return match config_dir_result {
        Ok(value) => {
            let mut config = PathBuf::from(value);
            config.push("surrealist");
            config.push("config.json");
            config.to_str().unwrap().to_string()
        }
        Err(_) => base_dir.to_str().unwrap().to_string(),
    };
}

#[tauri::command]
pub fn load_config() -> String {
    let read_op = File::open(get_config_path());
    let mut result = String::new();

    match read_op {
        Ok(mut file) => {
            file.read_to_string(&mut result)
                .expect("config should be readable");
        }
        Err(_) => {
            save_config(DEFAULT_CONFIG);
            result = DEFAULT_CONFIG.to_string();
        }
    }

    return result;
}

#[tauri::command]
pub fn save_config(config: &str) {
    let path_string = get_config_path();
    let path = Path::new(&path_string);
    let parent = path.parent().unwrap();
    fs::create_dir_all(parent).expect("config directory should be writable");

    let mut write_op = File::create(get_config_path()).unwrap();

    write_op
        .write_all(config.as_bytes())
        .expect("config should be writable");
}
