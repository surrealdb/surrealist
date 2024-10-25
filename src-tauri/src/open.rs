use std::fs::{self, read_to_string};

use log::info;
use serde::Serialize;
use tauri::State;

use crate::{
    whitelist::{read_allowed_files, write_allowed_files},
    OpenResourceState,
};

const MAX_FILE_SIZE: u64 = 5 * 1024 * 1024;

#[derive(Serialize)]
pub enum OpenedResource {
    File(FileResource),
    Link(LinkResource),
    Unknown,
}

#[derive(Serialize)]
pub struct FileResource {
    pub success: bool,
    pub name: String,
    pub path: String,
}

#[derive(Serialize)]
pub struct LinkResource {
    pub host: String,
    pub params: String,
}

#[tauri::command]
pub fn get_opened_resources(state: State<OpenResourceState>) -> Vec<OpenedResource> {
    info!("Fetching requested resources");

    state
        .0
        .lock()
        .unwrap()
        .iter()
        .filter_map(|u| match u.scheme() {
            "file" => {
                let path = u.to_file_path().unwrap();
                let ext = path
                    .extension()
                    .unwrap_or_default()
                    .to_str()
                    .unwrap_or_default();

                if ext != "surql" && ext != "surrealql" {
                    return None;
                }

                let success = path.metadata().unwrap().len() < MAX_FILE_SIZE;
                let name = path.file_stem().unwrap().to_owned().into_string().unwrap();
                let path = path.canonicalize().unwrap().to_str().unwrap().to_owned();
                let mut whitelist = read_allowed_files();

                if !whitelist.contains(&path) {
                    whitelist.push(path.clone());
                }

                write_allowed_files(whitelist);

                Some(OpenedResource::File(FileResource {
                    success,
                    name,
                    path,
                }))
            }
            "surrealist" => {
                let host = u.host_str().unwrap_or_default().to_owned();
                let params = u.query().unwrap_or_default().to_owned();

                Some(OpenedResource::Link(LinkResource { host, params }))
            }
            _ => Some(OpenedResource::Unknown),
        })
        .collect()
}

#[tauri::command]
pub fn read_query_file(path: String) -> Result<String, String> {
    let whitelist = read_allowed_files();

    match read_to_string(path.clone()) {
        Ok(content) => {
            if whitelist.contains(&path) {
                Ok(content)
            } else {
                Err("File is not allowed".into())
            }
        }
        Err(_) => Err("Failed to read file".into()),
    }
}

#[tauri::command]
pub fn write_query_file(path: String, content: String) -> Result<(), String> {
    let whitelist = read_allowed_files();

    if !whitelist.contains(&path) {
        return Err("File is not allowed".into());
    }

    match fs::write(path, content) {
        Ok(_) => Ok(()),
        Err(_) => Err("Failed to write file".into()),
    }
}

#[tauri::command]
pub fn prune_allowed_files(paths: Vec<String>) {
    let mut whitelist = read_allowed_files();

    whitelist.retain(|p| paths.contains(p));
    write_allowed_files(whitelist);
}
