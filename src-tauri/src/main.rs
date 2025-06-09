#![allow(deprecated)]
#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use std::{env, sync::OnceLock};

use database::DatabaseState;
use log::info;
use paths::get_logs_directory;
use tauri::{menu::{AboutMetadata, MenuBuilder, MenuItem, SubmenuBuilder}, AppHandle, Emitter, Manager, RunEvent};
use tauri_plugin_log::{Target, TargetKind};
use time::{format_description, OffsetDateTime};

mod analytics;
mod appbar;
mod config;
mod database;
mod open;
mod paths;
mod whitelist;
pub mod window;

static APP_HANDLE: OnceLock<AppHandle> = OnceLock::new();

fn set_app_handle(app: AppHandle) {
    APP_HANDLE.set(app).expect("App handle already set");
}

pub fn get_app_handle() -> &'static AppHandle {
    APP_HANDLE.get().expect("App handle not set")
}

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
            window::new_window,
            open::get_opened_resources,
            open::read_query_file,
            open::write_query_file,
            open::prune_allowed_files,
            open::open_query_file,
            open::open_in_explorer,
        ])
        .setup(|app| {
            info!("Launch args: {:?}", env::args());
            set_app_handle(app.handle().clone());

            let surrealist_menu = SubmenuBuilder::new(app, "Surrealist")
                .about_with_text(
					"About Surrealist",
                    Some(AboutMetadata {
                        name: Some("Surrealist".to_string()),
                        version: Some(app.package_info().version.to_string()),
                        short_version: None,
                        authors: Some(vec!["SurrealDB".to_string()]),
                        comments: None,
                        copyright: Some("© 2025 SurrealDB".to_string()),
                        license: Some("MIT".to_string()),
                        website: None,
                        website_label: None,
                        credits: None,
                        icon: None,
                    })
                )
				.separator()
				.text("settings", "Settings")
				.separator()
				.hide_with_text("Hide Surrealist")
				.hide_others()
				.show_all()
				.separator()
				.quit_with_text("Quit Surrealist")
                .build()?;

			let file_menu = SubmenuBuilder::new(app, "File")
				.text("new-window", "New Window")
				.build()?;

			let menu = MenuBuilder::new(app)
				.items(&[&surrealist_menu, &file_menu])
				.build()?;

			let _ = app.set_menu(menu);

            app.on_menu_event(move |app_handle: &tauri::AppHandle, event| {
                match event.id().0.as_str() {
                    "settings" => {
                        // TODO
                    }
                    "new-window" => {
                        let app_handle = app_handle.clone();
                        tauri::async_runtime::spawn(async move {
                            window::open_new_window(&app_handle).await;
                        });
                    }
                    _ => {}
                }
            });

            #[cfg(any(windows, target_os = "linux"))]
            {
                open::store_resources(get_app_handle(), env::args());
            }

            tauri::async_runtime::block_on(window::open_new_window(app.handle()));

            Ok(())
        })
        .build(context)
        .expect("Tauri failed to initialize");

    tauri.run(move |app, event| match event {
        #[cfg(target_os = "macos")]
        RunEvent::Ready => {
            appbar::macos::setup_dock_menu();
        }
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
