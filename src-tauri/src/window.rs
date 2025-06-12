use std::sync::{Mutex, OnceLock};
use tauri::{AppHandle, Emitter, Manager, WindowEvent};
use uuid::Uuid;

#[cfg(target_os = "macos")]
use tauri::menu::{MenuBuilder, SubmenuBuilder};

#[cfg(target_os = "macos")]
use tauri::App;

static LAST_FOCUSED_WINDOW: OnceLock<Mutex<Option<String>>> = OnceLock::new();

#[tauri::command]
pub fn toggle_devtools(window: tauri::WebviewWindow) {
    if window.is_devtools_open() {
        window.close_devtools();
    } else {
        window.open_devtools();
    }
}

#[tauri::command]
pub async fn new_window(app: AppHandle) {
    open_new_window(&app).await;
}

#[tauri::command]
pub async fn minimize_window(window: tauri::WebviewWindow) {
    println!("Minimizing window: {}", window.label());
    if let Err(e) = window.minimize() {
        eprintln!("Failed to minimize window: {}", e);
    }
}

#[tauri::command]
pub async fn close_window(window: tauri::WebviewWindow) {
    println!("Closing window: {}", window.label());
    if let Err(e) = window.close() {
        eprintln!("Failed to close window: {}", e);
    }
}

#[cfg(target_os = "macos")]
pub fn setup_menu_bar(app: &App) -> Result<(), Box<dyn std::error::Error>> {
    let surrealist_menu = SubmenuBuilder::new(app, "Surrealist")
        .text("about", "About Surrealist")
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

    app.set_menu(menu)?;

    app.on_menu_event(
        move |app_handle: &tauri::AppHandle, event| match event.id().0.as_str() {
            "about" => {
                emit_last(app_handle, "window:open_settings", "about");
            }
            "settings" => {
                emit_last(app_handle, "window:open_settings", "preferences");
            }
            "new-window" => {
                let app_handle = app_handle.clone();

                tauri::async_runtime::spawn(async move {
                    open_new_window(&app_handle).await;
                });
            }
            _ => {}
        },
    );

    Ok(())
}

pub async fn open_new_window(app: &AppHandle) {
    let window_label = format!("surrealist-{}", Uuid::new_v4());

    #[allow(unused_mut)]
    let mut builder = tauri::WebviewWindowBuilder::new(app, &window_label, Default::default())
        .title("Surrealist")
        .inner_size(1435.0, 775.0)
        .center()
        .min_inner_size(825.0, 675.0);

    #[cfg(target_os = "macos")]
    {
        builder = builder
            .title_bar_style(tauri::TitleBarStyle::Overlay)
            .hidden_title(true);
    }

    #[cfg(target_os = "windows")]
    {
        builder = builder.decorations(false);
    }

    let window = builder.build().expect("Failed to create window");

    window.on_window_event(move |event| {
        if let WindowEvent::Focused(focused) = event {
            if *focused {
                set_last_focused_window(&window_label);
            }
        }
    });
}

pub fn set_last_focused_window(label: &str) {
    let storage = LAST_FOCUSED_WINDOW.get_or_init(|| Mutex::new(None));
    let mut last = storage.lock().unwrap();
    *last = Some(label.to_string());
}

pub fn get_last_focused_window(app: &AppHandle) -> tauri::WebviewWindow {
    let storage = LAST_FOCUSED_WINDOW.get_or_init(|| Mutex::new(None));
    let last = storage.lock().unwrap();
    if let Some(label) = last.as_ref() {
        if let Some(window) = app.get_webview_window(label) {
            return window;
        }
    }

    // Fallback: return the first available window
    app.webview_windows()
        .values()
        .next()
        .expect("No windows available")
        .clone()
}

pub fn emit_last(app: &AppHandle, event: &str, payload: impl serde::Serialize + Clone) {
    let last_window = get_last_focused_window(app);

    app.emit_to(last_window.label(), event, payload)
        .expect("Failed to emit event");
}
