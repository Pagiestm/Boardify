#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::error::Error;

use tauri::webview::NewWindowResponse;
use tauri::{App, AppHandle, Manager, Url, WebviewUrl, WebviewWindow, WebviewWindowBuilder};
use tauri_plugin_deep_link::DeepLinkExt;
use tauri_plugin_opener::OpenerExt;

const MAIN_WINDOW: &str = "main";
const START_PATH: &str = "/dashboard";
const OAUTH_PATH: &str = "/oauth";
const DEEP_LINK_SCHEME: &str = "boardify";
const IN_APP_HOSTS: &[&str] = &["github.com"];
const INIT_SCRIPT: &str = include_str!("init.js");

fn app_url() -> Url {
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

fn open_in_browser(app: &AppHandle, url: &Url) {
    let _ = app.opener().open_url(url.as_str(), None::<&str>);
}

fn focus_main_window(app: &AppHandle) -> Option<WebviewWindow> {
    let window = app.get_webview_window(MAIN_WINDOW)?;
    let _ = window.unminimize();
    let _ = window.show();
    let _ = window.set_focus();
    Some(window)
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

    WebviewWindowBuilder::new(app, MAIN_WINDOW, WebviewUrl::External(start_url))
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
        .plugin(
            tauri_plugin_opener::Builder::new()
                .open_js_links_on_click(false)
                .build(),
        )
        .setup(|app| {
            create_main_window(app)?;
            listen_deep_links(app)?;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("erreur au lancement de Boardify");
}
