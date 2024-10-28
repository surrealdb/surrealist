use std::fs::{self, read_to_string};
use std::path::Path;
use std::sync::Mutex;

use log::info;
use serde::Serialize;
use tauri::{AppHandle, Emitter, Manager, State, Window};
use tauri_plugin_dialog::DialogExt;
use tauri_plugin_dialog::FilePath;

use crate::whitelist::{append_allowed_file, read_allowed_files, write_allowed_files};

const MAX_FILE_SIZE: u64 = 5 * 1024 * 1024;

/// The state holding resources requested for opening
pub struct OpenResourceState(pub Mutex<Vec<url::Url>>);

pub fn store_resources<T: IntoIterator<Item = String>>(app: &AppHandle, args: T) {
    let mut urls = Vec::new();

    for arg in args.into_iter().skip(1) {
        let path = Path::new(&arg);

        if let Ok(url) = url::Url::from_file_path(path) {
            urls.push(url);
        } else if let Ok(url) = url::Url::parse(&arg) {
            urls.push(url);
        }
    }

    if !urls.is_empty() {
        *app.state::<OpenResourceState>().0.lock().unwrap() = urls;
    }
}

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
    {
        info!("Fetching requested resources {:?}", state.0.lock().unwrap());
    }

    state
        .0
        .lock()
        .unwrap()
        .iter()
        .filter_map(|u| match u.scheme() {
            "file" => {
                let buf = u.to_file_path().unwrap();
                let success = buf.metadata().unwrap().len() < MAX_FILE_SIZE;
                let name = buf.file_stem().unwrap().to_owned().into_string().unwrap();
                let path = buf.canonicalize().unwrap().to_str().unwrap().to_owned();

                append_allowed_file(&buf);

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

#[derive(Serialize)]
pub struct QueryFile {
    name: String,
    path: String,
}

#[tauri::command]
pub async fn open_query_file(app: AppHandle, window: Window) {
    let mut dialog = app.dialog().file();

    #[cfg(desktop)]
    {
        dialog = dialog.set_parent(&window);
    }

    let files = dialog.blocking_pick_files().unwrap_or_default();
    let urls: Vec<url::Url> = files
        .iter()
        .filter_map(|f| match f {
            FilePath::Url(_) => None,
            FilePath::Path(buf) => Some(buf.display().to_string()),
        })
        .filter_map(|f| match url::Url::from_file_path(f) {
            Ok(u) => Some(u),
            Err(_) => None,
        })
        .collect();

    info!("My paths: {:?}", urls);

    *app.state::<OpenResourceState>().0.lock().unwrap() = urls;
    app.emit("open-resource", ()).unwrap();
}
