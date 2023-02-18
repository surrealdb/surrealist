use std::{fs::File, io::{Read, Write}, path::PathBuf};
use serde::Serialize;
use tauri::api::path::home_dir;
use surrealdb::sql::{parse, Statement, statements::DefineStatement};

const DEFAULT_CONFIG: &str = "{}";

fn get_config_path() -> String {
	let mut base_dir = home_dir().unwrap_or_else(|| PathBuf::from("."));

	base_dir.push(".surrealist.json");

	return base_dir.to_str().unwrap().to_string()
}

#[tauri::command]
pub fn load_config() -> String {
    let read_op = File::open(get_config_path());
	let mut result = String::new();

	match read_op {
		Ok(mut file) => {
			file.read_to_string(&mut result).expect("Failed to read config");
		}
		Err(_) => {
			save_config(DEFAULT_CONFIG);
			result = DEFAULT_CONFIG.to_string();
		}
	}

	return result;
}

#[tauri::command]
pub fn save_config(config: &str) {
	let mut write_op = File::create(get_config_path()).unwrap();

	write_op.write_all(config.as_bytes()).expect("Failed to write config");
}

#[derive(Serialize)]
pub struct ScopeFields {
	pub name: String,
	pub signup: String,
	pub signin: String,
	pub session: String
}

#[tauri::command]
pub fn extract_scope_fields(query: &str) -> Result<ScopeFields, String> {
	let parsed = parse(query)?;
	let query = &parsed[0];

	if let Statement::Define(d) = query {
		if let DefineStatement::Scope(s) = d {
			return Ok(ScopeFields {
				name: s.name.to_string(),
				signup: s.signup.clone().unwrap_or_default().to_string(),
				signin: s.signin.clone().unwrap_or_default().to_string(),
				session: s.session.clone().unwrap_or_default().to_string()
			});
		}
	}

	Err(String::from("Failed to extract scope"))
}