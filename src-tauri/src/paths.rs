use std::path::PathBuf;

use dirs_next::config_dir;

/// The directory where the application data is stored.
pub fn get_data_directory() -> PathBuf {
	let mut config_path = config_dir().expect("data directory should be resolvable");

    config_path.push("SurrealDB");
    config_path.push("Surrealist");

    config_path
}

/// The path to the configuration file
pub fn get_config_path() -> PathBuf {
    let mut config_path = get_data_directory();
    config_path.push("config.json");
    config_path
}

/// The path to the legacy configuration file (Surrealist 1.x)
pub fn get_legacy_config_path() -> PathBuf {
    let mut config_path = config_dir().expect("config directory should be resolvable");
    config_path.push("surrealist.json");
    config_path
}

/// The path where the legacy configuration file should be backed up
pub fn get_legacy_config_backup_path() -> PathBuf {
    let mut config_path = get_data_directory();
    config_path.push("config-v1.json");
    config_path
}

/// The path to the logs directory
pub fn get_logs_directory() -> PathBuf {
	let mut config_path = get_data_directory();
	config_path.push("logs");
	config_path
}