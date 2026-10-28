use tauri::{
    AppHandle, Manager, PhysicalPosition, Url, WebviewUrl, WebviewWindow, WebviewWindowBuilder,
    WindowEvent,
};
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};

use crate::{app_url, open_in_browser, open_in_main};

pub const WINDOW: &str = "quick-add";
pub const SHORTCUT_LABEL: &str = "Ctrl+Alt+N";

const PATH: &str = "/quick-add";
const CLOSE_PATH: &str = "/quick-add/close";
const OPEN_PATH: &str = "/quick-add/open";
const WIDTH: f64 = 560.0;
const HEIGHT: f64 = 340.0;
const OPEN_EVENT: &str = "window.dispatchEvent(new Event('boardify:quick-add'))";

fn shortcut() -> Shortcut {
    Shortcut::new(Some(Modifiers::CONTROL | Modifiers::ALT), Code::KeyN)
}

pub fn register_shortcut(app: &AppHandle) -> tauri::Result<()> {
    let quick_add = shortcut();

    app.plugin(
        tauri_plugin_global_shortcut::Builder::new()
            .with_handler(move |app, pressed, event| {
                if pressed == &quick_add && event.state() == ShortcutState::Pressed {
                    toggle(app);
                }
            })
            .build(),
    )?;

    // Un autre logiciel peut déjà utiliser ce raccourci : l'ajout rapide reste accessible
    // depuis l'icône de la barre des menus.
    if let Err(error) = app.global_shortcut().register(quick_add) {
        eprintln!("Raccourci {SHORTCUT_LABEL} indisponible : {error}");
    }

    Ok(())
}

fn hide(app: &AppHandle) {
    if let Some(window) = app.get_webview_window(WINDOW) {
        let _ = window.hide();
    }
}

fn handle_navigation(app: &AppHandle, url: &Url) -> bool {
    let app_url = app_url();
    if url.origin() != app_url.origin() {
        open_in_browser(app, url);
        return false;
    }

    match url.path() {
        CLOSE_PATH => {}
        OPEN_PATH => {
            if let Some((_, target)) = url.query_pairs().find(|(key, _)| key == "to") {
                open_in_main(app, &target);
            }
        }
        path if path == PATH || path.starts_with("/quick-add/") => return true,
        _ => {
            let mut target = url.path().to_string();
            if let Some(query) = url.query() {
                target.push('?');
                target.push_str(query);
            }
            open_in_main(app, &target);
        }
    }

    let app = app.clone();
    tauri::async_runtime::spawn(async move { hide(&app) });
    false
}

pub fn build(app: &AppHandle) -> tauri::Result<WebviewWindow> {
    let mut url = app_url();
    url.set_path(PATH);

    let navigation_handle = app.clone();
    let new_window_handle = app.clone();

    let window = WebviewWindowBuilder::new(app, WINDOW, WebviewUrl::External(url))
        .title("Nouvelle tâche")
        .inner_size(WIDTH, HEIGHT)
        .resizable(false)
        .minimizable(false)
        .maximizable(false)
        .always_on_top(true)
        .skip_taskbar(true)
        .visible(false)
        .center()
        .on_navigation(move |url| handle_navigation(&navigation_handle, url))
        .on_new_window(move |url, _features| {
            open_in_browser(&new_window_handle, &url);
            tauri::webview::NewWindowResponse::Deny
        })
        .build()?;

    let handle = window.clone();
    window.on_window_event(move |event| match event {
        WindowEvent::CloseRequested { api, .. } => {
            api.prevent_close();
            let _ = handle.hide();
        }
        WindowEvent::Focused(false) => {
            let _ = handle.hide();
        }
        _ => {}
    });

    Ok(window)
}

/// Place la fenêtre sur l'écran où se trouve la souris, au tiers de sa hauteur (comme Spotlight).
fn place_on_active_monitor(app: &AppHandle, window: &WebviewWindow) {
    let monitor = app.cursor_position().ok().and_then(|cursor| {
        window
            .available_monitors()
            .ok()?
            .into_iter()
            .find(|monitor| {
                let position = monitor.position();
                let size = monitor.size();
                cursor.x >= f64::from(position.x)
                    && cursor.x < f64::from(position.x) + f64::from(size.width)
                    && cursor.y >= f64::from(position.y)
                    && cursor.y < f64::from(position.y) + f64::from(size.height)
            })
    });

    let Some(monitor) = monitor else {
        let _ = window.center();
        return;
    };

    let position = monitor.position();
    let size = monitor.size();
    let scale = monitor.scale_factor();
    let x = f64::from(position.x) + (f64::from(size.width) - WIDTH * scale) / 2.0;
    let y = f64::from(position.y) + (f64::from(size.height) - HEIGHT * scale) / 3.0;
    let _ = window.set_position(PhysicalPosition::new(x.round() as i32, y.round() as i32));
}

pub fn show(app: &AppHandle) {
    let window = match app.get_webview_window(WINDOW) {
        Some(window) => window,
        None => match build(app) {
            Ok(window) => window,
            Err(error) => {
                eprintln!("Fenêtre d'ajout rapide impossible : {error}");
                return;
            }
        },
    };

    place_on_active_monitor(app, &window);
    let _ = window.show();
    let _ = window.set_focus();
    let _ = window.eval(OPEN_EVENT);
}

pub fn toggle(app: &AppHandle) {
    let visible = app
        .get_webview_window(WINDOW)
        .and_then(|window| window.is_visible().ok())
        .unwrap_or(false);

    if visible {
        hide(app);
    } else {
        show(app);
    }
}
