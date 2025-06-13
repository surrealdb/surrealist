use std::sync::{Mutex, OnceLock};
use tauri::{AppHandle, Emitter, Manager, WindowEvent};
use uuid::Uuid;

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
