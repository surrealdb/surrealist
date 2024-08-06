#![allow(deprecated)]
#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use std::{env, path::Path, sync::Mutex};

use database::DatabaseState;
use log::info;
use paths::get_logs_directory;
use tauri::{AppHandle, Manager, RunEvent};
use tauri_plugin_log::{Target, TargetKind};
use time::{format_description, OffsetDateTime};

mod config;
mod database;
mod open;
mod paths;
mod window;

struct OpenResourceState(pub Mutex<Vec<url::Url>>);

fn store_resources<T: IntoIterator<Item = String>>(app: &AppHandle, args: T) {
    let mut urls = Vec::new();

    for arg in args.into_iter().skip(1) {
        let path = Path::new(&arg);

        if let Ok(url) = url::Url::from_file_path(path) {
            urls.push(url);
        } else if let Ok(url) = url::Url::parse(&arg) {
            urls.push(url);
        }
    }

    if !urls.is_empty() {
        *app.state::<OpenResourceState>().0.lock().unwrap() = urls;
    }
}

fn main() {
    let context = tauri::generate_context!();
    let log_time_fmt =
        format_description::parse("[year]-[month]-[day] [hour]:[minute]:[second]").unwrap();

    // Build the Tauri instance
    let tauri = tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_deep_link::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_localhost::Builder::new(24454).build())
        .plugin(tauri_plugin_single_instance::init(|app, args, _| {
            info!("Single instance intercept: {:?}", args);

            let emit_event = args.len() > 1;

            store_resources(app, args);

            if emit_event {
                app.emit("open-resource", ()).unwrap();

                if let Some((_, window)) = app.webview_windows().iter().next() {
                    window.set_focus().unwrap();
                }
            }
        }))
        .plugin(
            tauri_plugin_log::Builder::new()
                .format(move |out, message, record| {
                    let now = OffsetDateTime::now_utc();
                    let time = now.format(&log_time_fmt).expect("Failed to format time");

                    out.finish(format_args!("{} [{}] {}", time, record.level(), message))
                })
                .targets([
                    Target::new(TargetKind::Stdout),
                    Target::new(TargetKind::Webview),
                    Target::new(TargetKind::Folder {
                        path: get_logs_directory(),
                        file_name: Some("surrealist".into()),
                    }),
                ])
                .build(),
        )
        .manage(OpenResourceState(Default::default()))
        .manage(DatabaseState(Default::default()))
        .invoke_handler(tauri::generate_handler![
            config::load_config,
            config::save_config,
            config::backup_config,
            config::has_config_backup,
            config::restore_config_backup,
            config::has_legacy_config,
            config::load_legacy_config,
            config::complete_legacy_migrate,
            database::start_database,
            database::stop_database,
            window::toggle_devtools,
            open::get_opened_resources,
        ])
        .setup(|app| {
            info!("Launch args: {:?}", env::args());

            #[cfg(any(windows, target_os = "linux"))]
            {
                store_resources(app.handle(), env::args());
            }

            let builder = tauri::WebviewWindowBuilder::new(app, "main", Default::default())
                .title("Surrealist")
                .inner_size(1235.0, 675.0)
                .center()
                .min_inner_size(1235.0, 675.0);

            #[cfg(target_os = "macos")]
            let builder = builder
                .title_bar_style(tauri::TitleBarStyle::Overlay)
                .hidden_title(true);

            builder.build().expect("Failed to create window");

            Ok(())
        })
        .build(context)
        .expect("Tauri failed to initialize");

    tauri.run(move |app, event| match event {
        #[cfg(any(target_os = "macos", target_os = "ios"))]
        RunEvent::Opened { urls } => {
            info!("Opened resources: {:?}", urls);

            *app.state::<OpenResourceState>().0.lock().unwrap() = urls;
            app.emit("open-resource", ()).unwrap();

            info!("Emitted open-resource event");
        }
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
