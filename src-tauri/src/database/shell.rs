// TODO Move shell implementation here

// ----- Start command builder

#[cfg(target_os="windows")]
pub fn build_start_command(args: Vec<&str>) -> Vec<String> {
	return vec![
		"cmd".to_owned(),
		"/c".to_owned(),
		args.join(" ")
	];
}

#[cfg(target_os="macos")]
pub fn build_start_command(args: Vec<&str>) -> Vec<String> {
	return vec![
		"zsh".to_owned(),
		"-l".to_owned(),
		"-c".to_owned(),
		args.join(" ")
	];
}

#[cfg(target_os="linux")]
pub fn build_start_command(args: Vec<&str>) -> Vec<String> {
	return vec![
		"bash".to_owned(),
		"-l".to_owned(),
		"-c".to_owned(),
		args.join(" ")
	];
}

// ----- Kill command builder

#[cfg(target_os="windows")]
pub fn build_kill_command(id: &u32) -> Vec<String> {
	return vec![
		"taskkill".to_owned(),
		"/pid".to_owned(),
		id.to_string(),
		"/f".to_owned(),
		"/t".to_owned()
	];
}

#[cfg(target_os="macos")]
pub fn build_kill_command(id: &u32) -> Vec<String> {
	return vec![
		"kill".to_owned(),
		"-9".to_owned(),
		id.to_string()
	];
}

#[cfg(target_os="linux")]
pub fn build_kill_command(id: &u32) -> Vec<String> {
	return vec![
		"kill".to_owned(),
		"-9".to_owned(),
		id.to_string()
	];
}