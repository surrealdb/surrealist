#[cfg(target_os = "macos")]
pub mod macos {
    use cocoa::appkit::{NSApp, NSMenu, NSMenuItem};
    use cocoa::base::nil;
    use cocoa::foundation::NSString;
    use objc::declare::ClassDecl;
    use objc::runtime::{Class, Object, Sel};
    use objc::{msg_send, sel, sel_impl};
    use std::sync::Once;

    pub fn setup_dock_menu() {
        static INIT: Once = Once::new();

        INIT.call_once(|| unsafe {
            let app = NSApp();
            let dock_menu: *mut Object = NSMenu::new(nil);
            let title = NSString::alloc(nil).init_str("New Window");
            let selector = Sel::register("openNewWindowAction:");
            let item: *mut Object = NSMenuItem::alloc(nil).initWithTitle_action_keyEquivalent_(
                title,
                selector,
                NSString::alloc(nil).init_str(""),
            );

            let class_name = "SurrealistDockMenuTarget";
            let mut decl = ClassDecl::new(class_name, Class::get("NSObject").unwrap()).unwrap();

            extern "C" fn open_new_window_action(_this: &Object, _cmd: Sel, _sender: *mut Object) {
                tauri::async_runtime::block_on(crate::window::open_new_window(
                    crate::get_app_handle(),
                ));
            }

            let selector = Sel::register("openNewWindowAction:");

            decl.add_method(
                selector,
                open_new_window_action as extern "C" fn(&Object, Sel, *mut Object),
            );

            let custom_class = decl.register();
            let target: *mut Object = msg_send![custom_class, new];

            let _: () = msg_send![item, setTarget: target];
            let _: () = msg_send![dock_menu, addItem: item];
            let _: () = msg_send![item, setEnabled: true];
            let _: () = msg_send![app, setDockMenu: dock_menu];
        });
    }
}