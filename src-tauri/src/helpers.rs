use std::{fs, path::PathBuf};

use tauri::{Manager, WebviewWindow};
use url::Url;

pub fn get_data_directory(app: &tauri::AppHandle) -> PathBuf {
    let mut config_path = app.path().config_dir().expect("data directory should be resolvable");

    config_path.push("SurrealDB");
    config_path.push("Surrealist");

    config_path
}

pub fn signal_open_request(win: &WebviewWindow, urls: &Vec<Url>) {
	let urls = urls
		.iter()
		.filter(|u| u.scheme() == "file")
		.map(|u| u.to_file_path().unwrap())
		.map(|p| fs::read_to_string(p).unwrap())
		.collect::<Vec<_>>()
		.join(",");

	let _ = win.eval(&format!("window.__FILE_OPEN_REQUEST = `{urls}`"));
	let _ = win.eval(&format!("window.onFileOpenRequest?.()"));

	let _ = win.set_focus();
}