use std::{process::{Child, Command, Stdio}, thread};

mod embedded;
mod shell;
pub struct DatabaseState(pub Option<Child>);

#[tauri::command]
pub fn start_database(state: tauri::State<DatabaseState>, username: &str, password: &str, port: u32, driver: &str, storage: &str) -> Result<(), String> {
	let process = state.0;

	if process.is_some() {
		process.unwrap().kill().ok();
		state.0 = None;
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

	// NOTE Pass ownership of child to state
	// state.0 = Some(child_proc);

	thread::spawn(move || {
		child_proc;
	});

	// NOTE - Pass ownership to state.process

	
	// *process = Some(child_proc); 
	// if let Some(stdout) = child.stdout {
    //     let lines = BufReader::new(stdout).lines().enumerate().take(10);
		
    //     for (counter, line) in lines {
    //         println!("{}, {:?}", counter, line);
    //     }
    // }

	Ok(())
}

#[tauri::command]
pub fn stop_database(state: tauri::State<DatabaseState>) -> Result<bool, String> {
	// let mut process = state.0;

	// if process.is_some() {
	// 	process.as_mut().unwrap().kill().map_err(|_| "Failed to kill database process")?;
	// 	state.0 = None;

	// 	return Ok(true)
	// }

	Ok(false)
}