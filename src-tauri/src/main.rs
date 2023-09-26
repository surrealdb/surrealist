#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use database::DatabaseState;
use tauri::{utils::config::AppUrl, Manager, RunEvent, WindowUrl};

mod config;
mod database;

fn main() {
    let mut context = tauri::generate_context!();
    let port = portpicker::pick_unused_port().expect("failed to find unused port");

    let url = format!("http://localhost:{}", port).parse().unwrap();
    let window_url = WindowUrl::External(url);

    context.config_mut().build.dist_dir = AppUrl::Url(window_url.clone());

    tauri::Builder::default()
        .plugin(tauri_plugin_localhost::Builder::new(port).build())
        .manage(DatabaseState(Default::default()))
        .invoke_handler(tauri::generate_handler![
            config::load_config,
            config::save_config,
            database::start_database,
            database::stop_database,
        ])
        .build(context)
        .expect("tauri should start successfully")
        .run(move |app, event| {
            if let RunEvent::Exit = event {
                let state = app.state::<DatabaseState>();
                let process = state.0.lock().unwrap().take();

                if let Some(child) = process {
                    database::kill_surreal_process(child.id())
                }
            }
        })
}
