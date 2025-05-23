use tauri::AppHandle;
use uuid::Uuid;

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
    let window_label = format!("surrealist-{}", Uuid::new_v4());
    let builder = tauri::WebviewWindowBuilder::new(&app, window_label, Default::default())
        .title("Surrealist")
        .inner_size(1435.0, 775.0)
        .center()
        .min_inner_size(825.0, 675.0);

    #[cfg(target_os = "macos")]
    let builder = builder
        .title_bar_style(tauri::TitleBarStyle::Overlay)
        .hidden_title(true);

    builder.build().expect("Failed to create window");
}
