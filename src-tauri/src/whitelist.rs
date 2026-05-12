use std::{
    fs::{create_dir_all, read_to_string, write},
    io,
    path::{Path, PathBuf},
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
pub fn write_allowed_files(list: Vec<String>) -> io::Result<()> {
    let path = get_file_whitelist_path();

    if let Some(parent) = path.parent() {
        create_dir_all(parent)?;
    }

    let content = list.join("\n");

    write(path, content)
}

/// Append a file to the list of allowed files
///
/// Returns the canonicalised path that was added to the whitelist so callers
/// can reuse it. Any failure to canonicalise or persist the whitelist is
/// surfaced as an [`io::Error`] rather than panicking — opening a file should
/// never crash Surrealist when the underlying file system is uncooperative.
pub fn append_allowed_file(path: &Path) -> io::Result<PathBuf> {
    let canonical = path.canonicalize()?;
    let canonical_string = canonical
        .to_str()
        .ok_or_else(|| io::Error::new(io::ErrorKind::InvalidData, "path is not valid UTF-8"))?
        .to_owned();

    let mut whitelist = read_allowed_files();

    if !whitelist.contains(&canonical_string) {
        whitelist.push(canonical_string);
    }

    write_allowed_files(whitelist)?;

    Ok(canonical)
}
