use std::{fs, os::unix::fs::MetadataExt};

use log::info;
use serde::Serialize;
use tauri::State;

use crate::OpenFileState;

const MAX_FILE_SIZE: u64 = 5 * 1024 * 1024;

#[derive(Serialize)]
pub struct OpenedFile {
	pub success: bool,
	pub name: String,
	pub query: String
}

#[tauri::command]
pub fn get_opened_queries(state: State<OpenFileState>) -> Vec<OpenedFile> {
	info!("Querying for opened files");
	
	state.0.lock().unwrap()
		.iter()
		.filter(|u| u.scheme() == "file")
		.map(|u| u.to_file_path().unwrap())
		.map(|p| {
			let success = p.metadata().unwrap().size() < MAX_FILE_SIZE;
			let name = p.file_stem().unwrap().to_owned().into_string().unwrap();
			
			let query = if success {
				fs::read_to_string(p).unwrap().trim().to_owned()
			} else {
				"".to_owned()
			};

			OpenedFile {
				success,
				name,
				query
			}
		})
		.collect()
}