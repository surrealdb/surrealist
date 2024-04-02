#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

#[cfg(target_os = "macos")]
#[macro_use]
extern crate objc;

#[cfg(target_os = "linux")]
extern crate webkit2gtk;

use database::DatabaseState;
use tauri::{Manager, RunEvent};
use window::configure_window;

mod config;
mod database;
mod helpers;
mod window;

fn main() {
    let context = tauri::generate_context!();

    // Build the Tauri instance
    let tauri = tauri::Builder::default()
        .manage(DatabaseState(Default::default()))
        .invoke_handler(tauri::generate_handler![
            config::load_config,
            config::load_legacy_config,
            config::save_config,
            config::has_legacy_config,
            config::complete_legacy_migrate,
            database::start_database,
            database::stop_database,
            window::set_window_scale,
            window::toggle_devtools,
        ])
        .setup(|app| {
            let window = app.get_window("main").unwrap();
            configure_window(window);
            Ok(())
        })
        .build(context)
        .expect("Tauri failed to initialize");

    // Await termination and kill the serving process
    tauri.run(move |app, event| {
        if let RunEvent::Exit = event {
            let state = app.state::<DatabaseState>();
            let process = state.0.lock().unwrap().take();

            if let Some(child) = process {
                database::kill_surreal_process(child.id())
            }
        }
    })
}
