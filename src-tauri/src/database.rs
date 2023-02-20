use std::{process::{Command, Child}, time::Instant};

pub struct DatabaseState {
	pub is_serving: bool,
	pub process: Option<Child>
}

#[tauri::command]
pub fn start_database(state: tauri::State<DatabaseState>, user: &str, pass: &str, port: u32, driver: &str, storage: &str) -> Result<(), String> {
	if state.is_serving {
		// stop_database(state);
	}

	let start_at = Instant::now();
	let mut args = vec![
		"surreal",
		"start",
		"--bind", format!("0.0.0.0:{}", port).as_str(),
		"--user", user,
		"--pass", pass,
		"--log",
		"debug"
	];

	match driver {
		"memory" => args.push("memory"),
		"file" => args.push(format!("file://{}", storage).as_str()),
		"tikv" => args.push(format!("tikv://{}", storage).as_str()),
		_ => Err("Invalid database driver")?
	}

	state.is_serving = true;

	Ok(())
}

#[tauri::command]
pub fn stop_database(state: tauri::State<DatabaseState>) {

}