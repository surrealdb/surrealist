use tauri::{
    menu::{MenuBuilder, SubmenuBuilder},
    App, AppHandle, Emitter,
};
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
    open_new_window(&app).await;
}

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
                app_handle
                    .emit("window:open_settings", "about")
                    .expect("Failed to emit open about event");
            }
            "settings" => {
                app_handle
                    .emit("window:open_settings", "preferences")
                    .expect("Failed to emit open settings event");
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
    let builder = tauri::WebviewWindowBuilder::new(app, window_label, Default::default())
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
