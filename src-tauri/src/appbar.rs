#[cfg(target_os = "macos")]
pub mod macos {
    use crate::get_app_handle;
    use cocoa::appkit::{NSApp, NSMenu, NSMenuItem, NSWindow};
    use cocoa::base::{id, nil};
    use cocoa::foundation::{NSAutoreleasePool, NSString};
    use objc::declare::ClassDecl;
    use objc::runtime::{Object, Sel};
    use objc::{class, msg_send, sel, sel_impl};

    extern "C" fn application_dock_menu(_: &Object, _: Sel, _: id) -> id {
        unsafe {
            let menu = NSMenu::new(nil).autorelease();
            let item = NSMenuItem::alloc(nil).initWithTitle_action_keyEquivalent_(
                NSString::alloc(nil).init_str("New Window"),
                sel!(openNewWindow:),
                NSString::alloc(nil).init_str(""),
            );
            menu.addItem_(item);
            menu
        }
    }

    extern "C" fn open_new_window(_: &Object, _: Sel, _: id) {
        tauri::async_runtime::block_on(crate::window::open_new_window(get_app_handle()));
    }

    pub fn setup_dock_menu() {
        unsafe {
            let superclass = class!(NSObject);
            let mut decl = ClassDecl::new("TauriAppDelegate", superclass).unwrap();

            decl.add_method(
                sel!(applicationDockMenu:),
                application_dock_menu as extern "C" fn(&Object, Sel, id) -> id,
            );
            decl.add_method(
                sel!(openNewWindow:),
                open_new_window as extern "C" fn(&Object, Sel, id),
            );

            let delegate_class = decl.register();
            let delegate: id = msg_send![delegate_class, new];
            let ns_app = NSApp();
            ns_app.setDelegate_(delegate);
        }
    }
}

#[cfg(target_os = "windows")]
pub mod windows {
    //
}
