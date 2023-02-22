use std::{process::{Child, Command, Stdio}, thread, sync::Mutex, io::{BufReader, BufRead}, time::Instant};

mod embedded;
mod shell;

pub struct DatabaseState(pub Mutex<Option<Child>>);

#[tauri::command]
pub fn start_database(window: tauri::Window, state: tauri::State<DatabaseState>, username: &str, password: &str, port: u32, driver: &str, storage: &str) -> Result<(), String> {
	let mut process = state.0.lock().unwrap();
	let start_at = Instant::now();

	if process.is_some() {
		return Err("Database already running".to_owned());
	}

	let child_result = start_surreal_process(username, password, port, driver, storage);
	let mut child_proc = match child_result {
		Ok(child) => child,
		Err(err) => {
			window.emit("database:error", err).expect("Failed to deliver error result");

			return Err("Failed to start database".to_owned());
		}
	};
	
	let output = child_proc.stderr.take().unwrap();

	*process = Some(child_proc);

	window.emit("database:start", true).expect("Failed to deliver start result");

	thread::spawn(move || {
		let reader = BufReader::new(output);

		for line in reader.lines() {
			let message = line.unwrap();

			println!("Surreal: {}", message);
			
			window.emit("database:output", message).expect("Failed to deliver console message");
		}

		let elapsed = start_at.elapsed().as_millis();

		if elapsed <= 500 {
			window.emit("database:error", "Surreal executable not found. Make sure the SurrealDB CLI is available in the command line.").expect("Failed to deliver error result");
		} else {
			window.emit("database:stop", true).expect("Failed to deliver stop result");
		}
	});

	Ok(())
}

#[tauri::command]
pub fn stop_database(state: tauri::State<DatabaseState>) -> Result<bool, String> {
	let process = state.0.lock().unwrap().take();

	return match process {
		None => Ok(false),
		Some(child) => {
			kill_surreal_process(child.id());
			
			Ok(true)
		}
	}
}

///
/// Kill the process with the given id
///
fn kill_surreal_process(id: u32) {
	let shell_cmd = shell::build_kill_command(&id);

	Command::new(&shell_cmd[0])
		.args(&shell_cmd[1..])
		.output()
		.expect("failed to execute kill process");
}

///
/// Start a new SurrealDB process and return the child process
///
fn start_surreal_process(username: &str, password: &str, port: u32, driver: &str, storage: &str) -> Result<Child, String> {
	let bind_addr = format!("0.0.0.0:{}", port);
	let mut args = vec![
		"surreal",
		"start",
		"--bind", &bind_addr,
		"--user", username,
		"--pass", password,
		"--log",
		"debug"
	];

	let file_uri = format!("file://{}", storage);
	let tikv_uri = format!("tikv://{}", storage);

	match driver {
		"memory" => args.push("memory"),
		"file" => args.push(file_uri.as_str()),
		"tikv" => args.push(tikv_uri.as_str()),
		_ => Err("Invalid database driver")?
	}

	let shell_cmd = shell::build_start_command(args);
	let child_proc = Command::new(&shell_cmd[0])
		.args(&shell_cmd[1..])
		.stdout(Stdio::null())
		.stderr(Stdio::piped())
		.spawn()
		.expect("failed to execute spawn process");

	Ok(child_proc)
}