#![allow(deprecated)]
#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use std::env;

use database::DatabaseState;
use log::info;
use paths::get_logs_directory;
use tauri::{Emitter, Manager, RunEvent};
use tauri_plugin_log::{Target, TargetKind};
use time::{format_description, OffsetDateTime};

mod analytics;
mod config;
mod database;
mod helpers;
mod open;
mod paths;
mod ssh;
mod whitelist;
mod window;

fn main() {
    env::set_var("WEBKIT_DISABLE_DMABUF_RENDERER", "1");

    let context = tauri::generate_context!();
    let log_time_fmt =
        format_description::parse("[year]-[month]-[day] [hour]:[minute]:[second]").unwrap();

    // Build the Tauri instance
    let tauri = tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_deep_link::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_localhost::Builder::new(24454).build())
        .plugin(tauri_plugin_single_instance::init(|app, args, _| {
            info!("Single instance intercept: {:?}", args);

            let emit_event = args.len() > 1;

            open::store_resources(app, args);

            if emit_event {
                app.emit("open-resource", ()).unwrap();
            }

            if let Some((_, window)) = app.webview_windows().iter().next() {
                window.set_focus().unwrap();
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
        .manage(open::OpenResourceState(Default::default()))
        .manage(DatabaseState(Default::default()))
        .invoke_handler(tauri::generate_handler![
            analytics::track_event,
            config::load_config,
            config::save_config,
            config::backup_config,
            config::has_config_backup,
            config::restore_config_backup,
            database::start_database,
            database::stop_database,
            window::toggle_devtools,
            open::get_opened_resources,
            open::read_query_file,
            open::write_query_file,
            open::prune_allowed_files,
            open::open_query_file,
            open::open_in_explorer,
            ssh::test_ssh_connection,
        ])
        .setup(|app| {
            info!("Launch args: {:?}", env::args());

            #[cfg(any(windows, target_os = "linux"))]
            {
                open::store_resources(app.handle(), env::args());
            }

            let builder = tauri::WebviewWindowBuilder::new(app, "main", Default::default())
                .title("Surrealist")
                .inner_size(1435.0, 775.0)
                .center()
                .min_inner_size(825.0, 675.0);

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

            *app.state::<open::OpenResourceState>().0.lock().unwrap() = urls;
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
