use std::{process::{Child, Command, Stdio}, thread::{self, Thread}, sync::Mutex, io::{BufReader, BufRead}};

mod embedded;
mod shell;
pub struct DatabaseState(pub Mutex<Option<Child>>);

#[tauri::command]
pub fn start_database(state: tauri::State<DatabaseState>, username: &str, password: &str, port: u32, driver: &str, storage: &str) -> Result<(), String> {
	let mut process = state.0.lock().unwrap();

	if process.is_some() {
		process.as_mut().unwrap().kill().ok();
		*process = None;
	}

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

	// NOTE - We have to keep these in scope in order to pass a slice to args
	let file_uri = format!("file://{}", storage);
	let tikv_uri = format!("tikv://{}", storage);

	match driver {
		"memory" => args.push("memory"),
		"file" => args.push(file_uri.as_str()),
		"tikv" => args.push(tikv_uri.as_str()),
		_ => Err("Invalid database driver")?
	}

	let shell_cmd = shell::build_command(args);

	println!("Running: {:?}", shell_cmd);

	let child_proc = Command::new(&shell_cmd[0])
		.args(&shell_cmd[1..])
		.stdout(Stdio::piped())
		.spawn()
		.expect("failed to execute process");

	let stream = child_proc.stdout.unwrap();

	// NOTE - Create the thread to read the output
	thread::spawn(|| {
		let lines = BufReader::new(stream).lines().enumerate().take(10);
		
		for (counter, line) in lines {
			println!("{}, {:?}", counter, line);
		}
	});

	// NOTE Pass ownership of child to state
	*process = Some(child_proc);

	// if let Some(stdout) = console_stream {
	//     let lines = BufReader::new(stdout).lines().enumerate().take(10);
		
	//     for (counter, line) in lines {
	//         println!("{}, {:?}", counter, line);
	//     }
	// }

	Ok(())
}

#[tauri::command]
pub fn stop_database(state: tauri::State<DatabaseState>) -> Result<bool, String> {
	let mut process = state.0.lock().unwrap();

	return if process.is_some() {
		process.as_mut().unwrap().kill().map_err(|_| "Failed to kill database process")?;
		*process = None;

		Ok(true)
	} else {
		Ok(false)
	}
}