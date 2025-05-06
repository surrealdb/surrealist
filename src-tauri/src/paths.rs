use std::path::PathBuf;

use dirs::config_dir;

/// The directory where the application data is stored.
pub fn get_data_directory() -> PathBuf {
    let mut config_path = config_dir().expect("data directory should be resolvable");
    let is_preview = env!("VITE_SURREALIST_PREVIEW") == "true";

    config_path.push("SurrealDB");

    if is_preview {
        config_path.push("SurrealistPreview");
    } else {
        config_path.push("Surrealist");
    }

    config_path
}

/// The path to the configuration file
pub fn get_config_path() -> PathBuf {
    let mut config_path = get_data_directory();
    config_path.push("config.json");
    config_path
}

/// The path to a backup configuration file
pub fn get_config_backup_path(version: u32) -> PathBuf {
    let mut config_path = get_data_directory();
    config_path.push("backups");
    config_path.push(format!("config-version-{}.json", version));
    config_path
}

/// The path to the file whitelist
pub fn get_file_whitelist_path() -> PathBuf {
    let mut config_path = get_data_directory();
    config_path.push("allowed_files");
    config_path
}

/// The path to the logs directory
pub fn get_logs_directory() -> PathBuf {
    let mut config_path = get_data_directory();
    config_path.push("logs");
    config_path
}

pub fn get_ssh_known_hosts_path() -> PathBuf {
    let mut config_path = get_data_directory();
    config_path.push("ssh");
    config_path.push("known_hosts.json");
    config_path
}
