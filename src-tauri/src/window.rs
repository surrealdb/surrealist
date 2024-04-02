#[allow(unused_variables)]
pub fn configure_window(window: tauri::Window) {
    let _ = window.with_webview(move |webview| {
        #[cfg(target_os = "macos")]
        unsafe {
            use cocoa::{
                appkit::{NSWindow, NSWindowStyleMask, NSWindowTitleVisibility},
                base::YES,
            };

            let id = webview.ns_window();
            let mut style_mask = id.styleMask();

            style_mask.set(NSWindowStyleMask::NSFullSizeContentViewWindowMask, true);

            id.setStyleMask_(style_mask);
            id.setTitlebarAppearsTransparent_(YES);
            id.setTitleVisibility_(NSWindowTitleVisibility::NSWindowTitleHidden);
        }
    });
}

#[tauri::command]
pub fn set_window_scale(window: tauri::Window, scale_factor: f64) {
    let _ = window.with_webview(move |webview| {
        #[cfg(target_os = "linux")]
        {
            // see https://docs.rs/webkit2gtk/0.18.2/webkit2gtk/struct.WebView.html
            // and https://docs.rs/webkit2gtk/0.18.2/webkit2gtk/trait.WebViewExt.html
            use webkit2gtk::traits::WebViewExt;
            webview.inner().set_zoom_level(scale_factor);
        }

        #[cfg(windows)]
        unsafe {
            // see https://docs.rs/webview2-com/0.19.1/webview2_com/Microsoft/Web/WebView2/Win32/struct.ICoreWebView2Controller.html
            webview.controller().SetZoomFactor(scale_factor).unwrap();
        }

        #[cfg(target_os = "macos")]
        unsafe {
            let () = msg_send![webview.inner(), setPageZoom: scale_factor];
        }
    });
}

#[tauri::command]
pub fn toggle_devtools(window: tauri::Window) {
    if window.is_devtools_open() {
        window.close_devtools();
    } else {
        window.open_devtools();
    }
}
