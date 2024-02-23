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
use tauri::{utils::config::AppUrl, Manager, RunEvent, WindowUrl};
use window::configure_window;

mod config;
mod database;
mod window;

fn main() {
    let mut context = tauri::generate_context!();
    let mut builder = tauri::Builder::default();

    // Configure insecure localhost address in order
    // to support connecting to non-HTTPS endpoints.
    if cfg!(not(debug_assertions)) {
        let port = portpicker::pick_unused_port().unwrap_or(24573);
        let url = format!("http://localhost:{}", port).parse().unwrap();
        let window_url = WindowUrl::External(url);

        context.config_mut().build.dist_dir = AppUrl::Url(window_url.clone());

        builder = builder.plugin(tauri_plugin_localhost::Builder::new(port).build());
    }

    // Build the Tauri instance
   let tauri = builder
        .manage(DatabaseState(Default::default()))
        .invoke_handler(tauri::generate_handler![
            config::load_config,
            config::save_config,
            database::start_database,
            database::stop_database,
            window::set_window_scale,
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
