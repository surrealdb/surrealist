#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

#[cfg(target_os = "macos")]
#[macro_use]
extern crate objc;

#[cfg(target_os = "linux")]
extern crate webkit2gtk;

use std::sync::Mutex;

use database::DatabaseState;
use paths::get_logs_directory;
use tauri::{Manager, RunEvent};
use tauri_plugin_log::{Target, TargetKind};
use window::configure_window;

mod config;
mod database;
mod window;
mod open;
mod paths;

struct OpenFileState(pub Mutex<Vec<url::Url>>);

fn main() {
    let context = tauri::generate_context!();

    // Build the Tauri instance
    let tauri = tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_log::Builder::new().targets([
            Target::new(TargetKind::Stdout),
            Target::new(TargetKind::Webview),
            Target::new(TargetKind::Folder {
				path: get_logs_directory(),
				file_name: Some("surrealist".into()),
			}),
        ]).build())
        .manage(OpenFileState(Default::default()))
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
			open::get_opened_queries,
        ])
        .setup(|app| {
            #[cfg(any(windows, target_os = "linux"))]
            {
                let mut urls = Vec::new();
				
                for arg in env::args().skip(1) {
                    if let Ok(url) = url::Url::parse(&arg) {
                        urls.push(url);
                    }
                }

                if !urls.is_empty() {
                    app.state::<OpenFileState>().0.lock().unwrap().replace(urls);
                }
            }
			
            let window = tauri::WebviewWindowBuilder::new(app, "main", Default::default()) 
                .title("Surrealist")
                .inner_size(1235.0, 675.0)
                .min_inner_size(1235.0, 675.0)
                .build()
                .unwrap();

            configure_window(window);

            Ok(())
        })
        .build(context)
        .expect("Tauri failed to initialize");

    tauri.run(move |app, event| match event {
		#[cfg(any(target_os = "macos", target_os = "ios"))]
		RunEvent::Opened { urls } => {
			*app.state::<OpenFileState>().0.lock().unwrap() = urls;
			app.emit("open:files", ()).unwrap();
		},
		RunEvent::Exit => {
			let state = app.state::<DatabaseState>();
			let process = state.0.lock().unwrap().take();

			if let Some(child) = process {
				database::kill_surreal_process(child.id())
			}
		}
		_ => (),
	})
}
