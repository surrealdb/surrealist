use std::sync::{Mutex, OnceLock};

use log::warn;
use tauri::{AppHandle, Emitter, Manager, WindowEvent};

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

pub async fn open_new_window(app: &AppHandle) {
    let current_time = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_secs())
        .unwrap_or_default();

    let window_label = format!("surrealist-{}", current_time);

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

    #[cfg(not(target_os = "macos"))]
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

    if let Ok(mut last) = storage.lock() {
        *last = Some(label.to_string());
    }
}

/// Return the most recently focused window, or any other available window
/// when none has been focused yet. Returns `None` when no windows are
/// registered with the app handle — this can happen briefly during startup
/// when a deep link event fires before the initial window finishes building.
pub fn get_last_focused_window(app: &AppHandle) -> Option<tauri::WebviewWindow> {
    let storage = LAST_FOCUSED_WINDOW.get_or_init(|| Mutex::new(None));

    if let Ok(last) = storage.lock() {
        if let Some(label) = last.as_ref() {
            if let Some(window) = app.get_webview_window(label) {
                return Some(window);
            }
        }
    }

    app.webview_windows().values().next().cloned()
}

/// Emit an event to the last focused window. Silently drops the event when no
/// window is available yet — the resource queue is also re-checked from the
/// frontend on initialise, so the pending payload is not lost.
pub fn emit_last(app: &AppHandle, event: &str, payload: impl serde::Serialize + Clone) {
    let Some(last_window) = get_last_focused_window(app) else {
        warn!("No window available to emit '{}' event yet", event);
        return;
    };

    if let Err(err) = app.emit_to(last_window.label(), event, payload) {
        warn!("Failed to emit '{}' event: {}", event, err);
    }
}
