use std::{
    fs::{read_to_string, write},
    path::Path,
};

use crate::paths::get_file_whitelist_path;

/// Read the list of allowed files from the whitelist
pub fn read_allowed_files() -> Vec<String> {
    let path = get_file_whitelist_path();

    read_to_string(path)
        .unwrap_or_default()
        .lines()
        .map(String::from)
        .collect::<Vec<String>>()
}

/// Write the list of allowed files to the whitelist
pub fn write_allowed_files(list: Vec<String>) {
    let path = get_file_whitelist_path();
    let content = list.join("\n");

    write(path, content).expect("whitelist should be writable");
}

/// Append a file to the list of allowed files
pub fn append_allowed_file(path: &Path) {
    let path = path.canonicalize().unwrap().to_str().unwrap().to_owned();
    let mut whitelist = read_allowed_files();

    if !whitelist.contains(&path) {
        whitelist.push(path.clone());
    }

    write_allowed_files(whitelist);
}
