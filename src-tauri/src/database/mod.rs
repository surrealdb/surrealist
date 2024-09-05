use log::info;
use std::{
    io::{BufRead, BufReader},
    process::{Child, Command, Stdio},
    sync::Mutex,
    thread,
    time::Instant,
};
use tauri::{Emitter, Manager};

mod shell;

pub struct DatabaseState(pub Mutex<Option<Child>>);

#[allow(clippy::too_many_arguments)]
#[tauri::command]
pub fn start_database(
    window: tauri::Window,
    state: tauri::State<DatabaseState>,
    username: &str,
    password: &str,
    port: u32,
    driver: &str,
    storage: &str,
    executable: &str,
    log_level: &str,
    legacy_compat: bool,
) -> Result<(), String> {
    let mut process = state.0.lock().unwrap();
    let start_at = Instant::now();

    if process.is_some() {
        window
            .emit("database:start", true)
            .expect("start result should be delivered");

        return Ok(());
    }

    info!("Serving database");

    let child_result = start_surreal_process(ServeOptions {
        username,
        password,
        port,
        driver,
        storage,
        executable,
        log_level,
        legacy_compat,
    });

    let mut child_proc = match child_result {
        Ok(child) => child,
        Err(err) => {
            window
                .emit("database:error", err)
                .expect("error result should be delivered");

            return Err("Failed to start database".to_owned());
        }
    };

    let output = child_proc.stderr.take().unwrap();

    *process = Some(child_proc);

    window
        .emit("database:start", true)
        .expect("start result should be delivered");

    thread::spawn(move || {
        let reader = BufReader::new(output);
        let mut has_started = false;

        for line in reader.lines() {
            let message = line.unwrap();

            println!("Surreal: {}", message);

            window
                .emit("database:output", message)
                .expect("console output should be delivered");

            has_started = true;
        }

        let elapsed = start_at.elapsed().as_millis();

        if elapsed <= 500 {
            if !has_started {
                window.emit("database:output", "SurrealDB did not start. Are you sure the Surreal executable is available?").expect("console output should be delivered");
            }

            window
                .emit(
                    "database:error",
                    "SurrealDB did not start correctly, check the console for more information",
                )
                .expect("error result should be delivered");
        } else {
            window
                .emit("database:stop", true)
                .expect("stop result should be delivered");
        }

        let handle = window.app_handle();
        let state = handle.state::<DatabaseState>();
        let mut process = state.0.lock().unwrap();

        *process = None;
    });

    Ok(())
}

#[tauri::command]
pub fn stop_database(state: tauri::State<DatabaseState>) -> Result<bool, String> {
    let process = state.0.lock().unwrap().take();

    match process {
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
pub fn kill_surreal_process(id: u32) {
    let shell_cmd = shell::build_kill_command(&id);
    let mut cmd_chain = Command::new(&shell_cmd[0]);

    shell::configure_command(&mut cmd_chain);

    cmd_chain
        .args(&shell_cmd[1..])
        .output()
        .expect("surreal process should be killed");
}

pub struct ServeOptions<'s> {
    username: &'s str,
    password: &'s str,
    port: u32,
    driver: &'s str,
    storage: &'s str,
    executable: &'s str,
    log_level: &'s str,
    legacy_compat: bool,
}

///
/// Start a new SurrealDB process and return the child process
///
pub fn start_surreal_process(options: ServeOptions) -> Result<Child, String> {
    let bind_addr = format!("0.0.0.0:{}", options.port);
    let path = if options.executable.is_empty() {
        "surreal"
    } else {
        options.executable
    };

    let mut args = vec![
        path,
        "start",
        "--bind",
        &bind_addr,
        "--user",
        options.username,
        "--pass",
        options.password,
        "--log",
        options.log_level,
    ];

    if options.legacy_compat {
        args.push("--auth")
    }

    let file_uri = format!("rocksdb://{}", options.storage);
    let surrealkv_uri = format!("surrealkv://{}", options.storage);
    let tikv_uri = format!("tikv://{}", options.storage);

    match options.driver {
        "memory" => args.push("memory"),
        "file" => args.push(&file_uri),
        "surrealkv" => args.push(&surrealkv_uri),
        "tikv" => args.push(&tikv_uri),
        _ => Err("Invalid database driver")?,
    }

    args.push("--allow-all");

    println!("Launching with: {:?}", args);

    let shell_cmd = shell::build_start_command(args);
    let mut cmd_chain = Command::new(&shell_cmd[0]);

    shell::configure_command(&mut cmd_chain);

    let child_proc = cmd_chain
        .args(&shell_cmd[1..])
        .stdout(Stdio::null())
        .stderr(Stdio::piped())
        .env("SURREAL_EXPERIMENTAL_GRAPHQL", "true")
        .spawn()
        .expect("surreal process should be spawned");

    Ok(child_proc)
}
