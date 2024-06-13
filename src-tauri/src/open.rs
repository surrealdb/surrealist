use std::fs::read_to_string;

use log::info;
use serde::Serialize;
use tauri::State;

use crate::OpenResourceState;

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
    pub query: String,
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

                let query = if success {
                    read_to_string(path).unwrap().trim().to_owned()
                } else {
                    "".to_owned()
                };

                Some(OpenedResource::File(FileResource {
                    success,
                    name,
                    query,
                }))
            }
            "surrealist" => Some(OpenedResource::Link(LinkResource {
                host: u.host_str().unwrap_or_default().to_owned(),
                params: u.query().unwrap_or_default().to_owned(),
            })),
            _ => Some(OpenedResource::Unknown),
        })
        .collect()
}
