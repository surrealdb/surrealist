// TODO Move shell implementation here

#[cfg(target_os="windows")]
pub fn build_command(args: Vec<&str>) -> Vec<String> {
	return vec![
		"cmd".to_owned(),
		"/c".to_owned(),
		args.join(" ")
	];
}

#[cfg(target_os="macos")]
pub fn build_command() {
	return vec![
		"zsh".to_owned(),
		"-l".to_owned(),
		"-c".to_owned(),
		args.join(" ")
	];
}

#[cfg(target_os="linux")]
pub fn build_command() {
	return vec![
		"bash".to_owned(),
		"-l".to_owned(),
		"-c".to_owned(),
		args.join(" ")
	];
}