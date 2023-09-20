#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use database::DatabaseState;
use tauri::{Manager, RunEvent};

mod config;
mod database;

fn main() {
    tauri::Builder::default()
        .manage(DatabaseState(Default::default()))
        .invoke_handler(tauri::generate_handler![
            config::load_config,
            config::save_config,
            database::start_database,
            database::stop_database,
        ])
        .build(tauri::generate_context!())
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
