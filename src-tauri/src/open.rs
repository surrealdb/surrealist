use std::fs::{self, read_to_string};
use std::path::{Path, PathBuf};
use std::sync::Mutex;

use log::info;
use serde::Serialize;
use tauri::{AppHandle, Manager, State, Window};
use tauri_plugin_dialog::DialogExt;
use tauri_plugin_dialog::FilePath;

use crate::whitelist::{append_allowed_file, read_allowed_files, write_allowed_files};
use crate::window;

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
    /// Deep-link query string carried alongside the file (e.g.
    /// `endpoint=...&ns=...&db=...&user=...` from a JetBrains "Open in
    /// Surrealist" launch). Empty for plain `file://` opens that didn't
    /// originate from a `surrealist://` URL.
    pub params: String,
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
        .map(|u| match u.scheme() {
            "file" => {
                let buf = u.to_file_path().unwrap();

                build_file_resource(buf, String::new())
                    .map(OpenedResource::File)
                    .unwrap_or(OpenedResource::Unknown)
            }
            "surrealist" => {
                let params = u.query().unwrap_or_default().to_owned();

                // External tooling (e.g. the JetBrains plugin's "Open in
                // Surrealist" action) hands SurrealQL files off as
                // `surrealist://open?file=<path>&endpoint=...&ns=...&...`.
                // We deliberately accept the file path *from the query
                // string* rather than the URL path component: macOS routes
                // `surrealist:///abs/path.surql` URLs through
                // NSDocumentController's auto-reopen flow on cold start
                // (because the `.surql` extension matches our registered
                // file association), which fires `application:openURLs:`
                // before tao's event loop is ready and panics tao at the
                // FFI boundary. Keeping the path out of the URL path keeps
                // macOS from recognising the URL as a document open.
                if let Some(file) = file_resource_from_link(&params) {
                    OpenedResource::File(file)
                } else {
                    let host = u.host_str().unwrap_or_default().to_owned();

                    OpenedResource::Link(LinkResource { host, params })
                }
            }
            _ => OpenedResource::Unknown,
        })
        .collect()
}

/// Build a `FileResource` from an absolute path, returning `None` if any of
/// the OS-level metadata calls fail. Centralising this here keeps both the
/// `file://` arm and the `surrealist://` hybrid arm in sync — they both need
/// the same size check, whitelist append, and stem extraction.
///
/// A failure to persist the whitelist update is logged but does not block the
/// open; the next `read_query_file` call will simply be rejected and the user
/// can re-open the file.
fn build_file_resource(buf: PathBuf, params: String) -> Option<FileResource> {
    let metadata = buf.metadata().ok()?;
    let success = metadata.len() < MAX_FILE_SIZE;
    let name = buf.file_stem()?.to_str()?.to_owned();
    let path = buf.canonicalize().ok()?.to_str()?.to_owned();

    if let Err(err) = append_allowed_file(&buf) {
        log::warn!("Failed to whitelist '{}': {}", buf.display(), err);
    }

    Some(FileResource {
        success,
        name,
        path,
        params,
    })
}

/// Translate the query string of a `surrealist://...` URL into a
/// `FileResource` by reading the target file path from `?file=...`.
///
/// We deliberately refuse to read the file path from the URL's *path*
/// component because macOS routes `surrealist:///abs/file.surql` URLs through
/// `NSDocumentController` on cold start (the `.surql` extension matches our
/// registered file association), which fires `application:openURLs:` before
/// tao's event loop is ready and aborts the process. Forcing the file path
/// into the query string keeps the URL path empty and avoids the document
/// auto-reopen pathway entirely.
fn file_resource_from_link(params: &str) -> Option<FileResource> {
    let file_value = url::form_urlencoded::parse(params.as_bytes())
        .find(|(key, _)| key == "file")
        .map(|(_, value)| value.into_owned())?;

    if file_value.is_empty() {
        return None;
    }

    let buf = PathBuf::from(&file_value);
    if !buf.is_absolute() {
        return None;
    }

    let extension = buf
        .extension()
        .and_then(|s| s.to_str())
        .map(|s| s.to_ascii_lowercase());

    if !matches!(extension.as_deref(), Some("surql") | Some("surrealql")) {
        return None;
    }

    build_file_resource(buf, params.to_owned())
}

#[tauri::command]
pub fn clear_opened_resources(state: State<OpenResourceState>) {
    *state.0.lock().unwrap() = Vec::new();
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
        .filter_map(|f| url::Url::from_file_path(f).ok())
        .collect();

    info!("My paths: {:?}", urls);

    *app.state::<OpenResourceState>().0.lock().unwrap() = urls;
    window::emit_last(&app, "open-resource", ());
}

#[tauri::command]
pub async fn open_in_explorer(path: String) {
    let whitelist = read_allowed_files();

    if whitelist.contains(&path) {
        showfile::show_path_in_file_manager(Path::new(&path));
    }
}
