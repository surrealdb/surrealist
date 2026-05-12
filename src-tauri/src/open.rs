use std::fs::{self, read_to_string};
use std::path::{Path, PathBuf};
use std::sync::Mutex;

use log::{info, warn};
use percent_encoding::percent_decode_str;
use serde::Serialize;
use tauri::{AppHandle, Manager, State, Window};
use tauri_plugin_dialog::DialogExt;
use tauri_plugin_dialog::FilePath;
use url::Url;

use crate::whitelist::{append_allowed_file, read_allowed_files, write_allowed_files};
use crate::window;

const MAX_FILE_SIZE: u64 = 5 * 1024 * 1024;

/// The state holding resources requested for opening
pub struct OpenResourceState(pub Mutex<Vec<Url>>);

pub fn store_resources<T: IntoIterator<Item = String>>(app: &AppHandle, args: T) {
    let mut urls = Vec::new();

    for arg in args.into_iter().skip(1) {
        let path = Path::new(&arg);

        if let Ok(url) = Url::from_file_path(path) {
            urls.push(url);
        } else if let Ok(url) = Url::parse(&arg) {
            urls.push(url);
        }
    }

    if !urls.is_empty() {
        if let Ok(mut state) = app.state::<OpenResourceState>().0.lock() {
            *state = urls;
        }
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
    /// Raw query string from a `surrealist://<path>?<query>` deep link, e.g.
    /// passed by the JetBrains plugin to carry connection settings alongside
    /// the file. `None` when the file was opened via a plain `file://` URL or
    /// when the deep link didn't include a query.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub params: Option<String>,
}

#[derive(Serialize)]
pub struct LinkResource {
    pub host: String,
    pub params: String,
}

#[tauri::command]
pub fn get_opened_resources(state: State<OpenResourceState>) -> Vec<OpenedResource> {
    let urls = match state.0.lock() {
        Ok(guard) => guard.clone(),
        Err(err) => {
            warn!("Failed to read opened resources: {}", err);
            return Vec::new();
        }
    };

    info!("Fetching requested resources {:?}", urls);

    urls.iter().map(parse_resource).collect()
}

/// Translate a stored URL into the resource payload consumed by the frontend.
///
/// Errors are converted into [`OpenedResource::Unknown`] so the rest of the
/// queue can still be processed and Surrealist never panics on a malformed
/// or unreachable resource.
fn parse_resource(url: &Url) -> OpenedResource {
    match url.scheme() {
        "file" => match url.to_file_path() {
            Ok(buf) => resource_from_path(&buf),
            Err(_) => {
                warn!("Failed to convert file URL to path: {}", url);
                OpenedResource::Unknown
            }
        },
        "surrealist" => {
            let host = url.host_str().unwrap_or_default();

            // External integrations (e.g. the JetBrains plugin) hand off files
            // as `surrealist:///path/to/file.surql`. Treat URLs without a host
            // and with a non-trivial path as a file open request, and forward
            // any query string so the frontend can apply connection settings.
            if host.is_empty() {
                if let Some(buf) = surrealist_url_to_path(url) {
                    let mut resource = resource_from_path(&buf);
                    if let OpenedResource::File(file) = &mut resource {
                        file.params = url.query().map(str::to_owned);
                    }
                    return resource;
                }
            }

            OpenedResource::Link(LinkResource {
                host: host.to_owned(),
                params: url.query().unwrap_or_default().to_owned(),
            })
        }
        _ => {
            warn!("Ignoring resource with unsupported scheme: {}", url);
            OpenedResource::Unknown
        }
    }
}

/// Extract a filesystem path from a `surrealist://` URL when it is being used
/// to hand off a file (rather than triggering an in-app action).
///
/// Returns `None` for URLs that don't carry a path — those are treated as
/// regular deep links by the caller.
fn surrealist_url_to_path(url: &Url) -> Option<PathBuf> {
    let raw_path = url.path();

    if raw_path.is_empty() || raw_path == "/" {
        return None;
    }

    let decoded = percent_decode_str(raw_path)
        .decode_utf8()
        .ok()?
        .into_owned();

    let candidate = if cfg!(windows) {
        // Windows paths come through as `/C:/path/to/file`; strip the leading
        // slash so the result is a usable filesystem path.
        decoded.trim_start_matches('/').to_owned()
    } else {
        decoded
    };

    if candidate.is_empty() {
        None
    } else {
        Some(PathBuf::from(candidate))
    }
}

/// Build a [`FileResource`] for a path on disk, or [`OpenedResource::Unknown`]
/// when the path can't be read or whitelisted.
fn resource_from_path(buf: &Path) -> OpenedResource {
    let metadata = match buf.metadata() {
        Ok(meta) => meta,
        Err(err) => {
            warn!("Failed to read metadata for {:?}: {}", buf, err);
            return OpenedResource::Unknown;
        }
    };

    if !metadata.is_file() {
        warn!("Refusing to open non-file resource: {:?}", buf);
        return OpenedResource::Unknown;
    }

    let success = metadata.len() < MAX_FILE_SIZE;

    let name = buf
        .file_stem()
        .map(|s| s.to_string_lossy().into_owned())
        .unwrap_or_else(|| "Untitled".to_owned());

    let canonical = match append_allowed_file(buf) {
        Ok(canonical) => canonical,
        Err(err) => {
            warn!("Failed to whitelist file {:?}: {}", buf, err);
            return OpenedResource::Unknown;
        }
    };

    let path = canonical.to_string_lossy().into_owned();

    OpenedResource::File(FileResource {
        success,
        name,
        path,
        params: None,
    })
}

#[tauri::command]
pub fn clear_opened_resources(state: State<OpenResourceState>) {
    if let Ok(mut guard) = state.0.lock() {
        *guard = Vec::new();
    }
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

    if let Err(err) = write_allowed_files(whitelist) {
        warn!("Failed to prune file whitelist: {}", err);
    }
}

#[tauri::command]
pub async fn open_query_file(app: AppHandle, window: Window) {
    let mut dialog = app.dialog().file();

    #[cfg(desktop)]
    {
        dialog = dialog.set_parent(&window);
    }

    let files = dialog.blocking_pick_files().unwrap_or_default();
    let urls: Vec<Url> = files
        .iter()
        .filter_map(|f| match f {
            FilePath::Url(_) => None,
            FilePath::Path(buf) => Some(buf.display().to_string()),
        })
        .filter_map(|f| Url::from_file_path(f).ok())
        .collect();

    info!("My paths: {:?}", urls);

    if let Ok(mut guard) = app.state::<OpenResourceState>().0.lock() {
        *guard = urls;
    }

    window::emit_last(&app, "open-resource", ());
}

#[tauri::command]
pub async fn open_in_explorer(path: String) {
    let whitelist = read_allowed_files();

    if whitelist.contains(&path) {
        showfile::show_path_in_file_manager(Path::new(&path));
    }
}
