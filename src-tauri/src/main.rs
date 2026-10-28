#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod quick_add;
mod tray;
mod updater;

use std::error::Error;

use tauri::webview::NewWindowResponse;
use tauri::{
    App, AppHandle, Manager, Url, WebviewUrl, WebviewWindow, WebviewWindowBuilder, WindowEvent,
};
use tauri_plugin_deep_link::DeepLinkExt;
use tauri_plugin_opener::OpenerExt;

pub(crate) const MAIN_WINDOW: &str = "main";
const START_PATH: &str = "/dashboard";
const OAUTH_PATH: &str = "/oauth";
const DEEP_LINK_SCHEME: &str = "boardify";
const IN_APP_HOSTS: &[&str] = &["github.com"];
const INIT_SCRIPT: &str = include_str!("init.js");

pub(crate) fn app_url() -> Url {
    let default = if cfg!(debug_assertions) {
        "http://localhost:3000"
    } else {
        "https://boardify.theotimepagies.com"
    };

    Url::parse(option_env!("BOARDIFY_URL").unwrap_or(default)).expect("BOARDIFY_URL invalide")
}

fn opens_in_app(url: &Url, app_url: &Url) -> bool {
    url.origin() == app_url.origin()
        || url
            .host_str()
            .is_some_and(|host| IN_APP_HOSTS.contains(&host))
        || matches!(url.scheme(), "about" | "data" | "blob")
}

pub(crate) fn open_in_browser(app: &AppHandle, url: &Url) {
    let _ = app.opener().open_url(url.as_str(), None::<&str>);
}

pub(crate) fn focus_main_window(app: &AppHandle) -> Option<WebviewWindow> {
    let window = app.get_webview_window(MAIN_WINDOW)?;
    let _ = window.unminimize();
    let _ = window.show();
    let _ = window.set_focus();
    Some(window)
}

/// Ouvre un chemin de Boardify (ex. `/workspaces/…/tasks/…`) dans la fenêtre principale.
pub(crate) fn open_in_main(app: &AppHandle, path: &str) {
    if !path.starts_with('/') || path.starts_with("//") {
        return;
    }

    let app_url = app_url();
    let Ok(target) = app_url.join(path) else {
        return;
    };
    if target.origin() != app_url.origin() {
        return;
    }

    if let Some(window) = focus_main_window(app) {
        let _ = window.navigate(target);
    }
}

fn handle_deep_link(app: &AppHandle, url: &Url) {
    if url.scheme() != DEEP_LINK_SCHEME || url.host_str() != Some("oauth") {
        return;
    }

    let mut target = app_url();
    target.set_path(OAUTH_PATH);
    target.set_query(url.query());

    if let Some(window) = focus_main_window(app) {
        let _ = window.navigate(target);
    }
}

fn create_main_window(app: &App) -> tauri::Result<()> {
    let app_url = app_url();
    let mut start_url = app_url.clone();
    start_url.set_path(START_PATH);

    let init_script = INIT_SCRIPT.replace(
        "__BOARDIFY_ORIGIN__",
        &app_url.origin().ascii_serialization(),
    );
    let navigation_handle = app.handle().clone();
    let new_window_handle = app.handle().clone();

    let window = WebviewWindowBuilder::new(app, MAIN_WINDOW, WebviewUrl::External(start_url))
        .title("Boardify")
        .inner_size(1280.0, 820.0)
        .min_inner_size(900.0, 600.0)
        .initialization_script(&init_script)
        .on_navigation(move |url| {
            let in_app = opens_in_app(url, &app_url);
            if !in_app {
                open_in_browser(&navigation_handle, url);
            }
            in_app
        })
        .on_new_window(move |url, _features| {
            open_in_browser(&new_window_handle, &url);
            NewWindowResponse::Deny
        })
        .build()?;

    // Fermer la fenêtre la masque : Boardify reste disponible dans la barre des menus.
    let handle = window.clone();
    window.on_window_event(move |event| {
        if let WindowEvent::CloseRequested { api, .. } = event {
            api.prevent_close();
            let _ = handle.hide();
        }
    });

    Ok(())
}

fn listen_deep_links(app: &App) -> Result<(), Box<dyn Error>> {
    #[cfg(any(windows, target_os = "linux"))]
    app.deep_link().register_all()?;

    let handle = app.handle().clone();
    app.deep_link().on_open_url(move |event| {
        for url in event.urls() {
            handle_deep_link(&handle, &url);
        }
    });

    for url in app.deep_link().get_current()?.unwrap_or_default() {
        handle_deep_link(app.handle(), &url);
    }

    Ok(())
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            focus_main_window(app);
        }))
        .plugin(tauri_plugin_deep_link::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(
            tauri_plugin_opener::Builder::new()
                .open_js_links_on_click(false)
                .build(),
        )
        .manage(updater::UpdateState::default())
        .manage(tray::TrayState::default())
        .invoke_handler(tauri::generate_handler![tray::sync_desktop_state])
        .setup(|app| {
            create_main_window(app)?;
            listen_deep_links(app)?;
            tray::create(app.handle())?;
            quick_add::register_shortcut(app.handle())?;
            quick_add::build(app.handle())?;
            if !cfg!(debug_assertions) {
                updater::schedule(app.handle());
            }
            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("erreur au lancement de Boardify")
        .run(|app, event| {
            // Clic sur l'icône du Dock alors que la fenêtre est masquée.
            #[cfg(target_os = "macos")]
            if let tauri::RunEvent::Reopen { .. } = event {
                focus_main_window(app);
            }
            #[cfg(not(target_os = "macos"))]
            let _ = (app, event);
        });
}
