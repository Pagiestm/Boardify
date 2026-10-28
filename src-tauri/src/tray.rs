use std::sync::Mutex;

use serde::Deserialize;
use tauri::menu::{Menu, MenuEvent, MenuItem, PredefinedMenuItem};
use tauri::tray::TrayIconBuilder;
use tauri::{AppHandle, Manager, Wry};

use crate::{focus_main_window, open_in_main, quick_add, updater, MAIN_WINDOW};

const TRAY_ID: &str = "main";
const MAX_TASKS: usize = 8;
const MAX_TITLE: usize = 48;
const TASK_PREFIX: &str = "task:";

#[derive(Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct TrayTask {
    title: String,
    path: String,
    overdue: bool,
}

#[derive(Deserialize, Default, Clone)]
#[serde(rename_all = "camelCase")]
pub struct DesktopState {
    unread: u32,
    tasks: Vec<TrayTask>,
    tasks_path: Option<String>,
}

#[derive(Default)]
pub struct TrayState(Mutex<DesktopState>);

fn truncate(title: &str) -> String {
    if title.chars().count() <= MAX_TITLE {
        return title.to_string();
    }
    let short: String = title.chars().take(MAX_TITLE - 1).collect();
    format!("{}…", short.trim_end())
}

fn build_menu(app: &AppHandle, state: &DesktopState) -> tauri::Result<Menu<Wry>> {
    let menu = Menu::new(app)?;

    menu.append(&MenuItem::with_id(
        app,
        "open",
        "Ouvrir Boardify",
        true,
        None::<&str>,
    )?)?;
    menu.append(&MenuItem::with_id(
        app,
        "quick-add",
        "Nouvelle tâche…",
        true,
        Some(quick_add::SHORTCUT_LABEL),
    )?)?;
    menu.append(&PredefinedMenuItem::separator(app)?)?;

    let header = if state.tasks.is_empty() {
        "Rien de prévu aujourd'hui".to_string()
    } else {
        format!("À faire aujourd'hui ({})", state.tasks.len())
    };
    menu.append(&MenuItem::with_id(
        app,
        "today",
        header,
        false,
        None::<&str>,
    )?)?;

    for (index, task) in state.tasks.iter().take(MAX_TASKS).enumerate() {
        let label = if task.overdue {
            format!("{} · en retard", truncate(&task.title))
        } else {
            truncate(&task.title)
        };
        menu.append(&MenuItem::with_id(
            app,
            format!("{TASK_PREFIX}{index}"),
            label,
            true,
            None::<&str>,
        )?)?;
    }

    if state.tasks_path.is_some() {
        let label = if state.tasks.len() > MAX_TASKS {
            format!("Voir les {} tâches…", state.tasks.len())
        } else {
            "Voir mes tâches…".to_string()
        };
        menu.append(&MenuItem::with_id(app, "tasks", label, true, None::<&str>)?)?;
    }

    menu.append(&PredefinedMenuItem::separator(app)?)?;
    menu.append(&MenuItem::with_id(
        app,
        "updates",
        "Rechercher des mises à jour…",
        true,
        None::<&str>,
    )?)?;
    menu.append(&MenuItem::with_id(
        app,
        "quit",
        "Quitter Boardify",
        true,
        None::<&str>,
    )?)?;

    Ok(menu)
}

fn tooltip(state: &DesktopState) -> String {
    match state.unread {
        0 => "Boardify".to_string(),
        1 => "Boardify · 1 notification non lue".to_string(),
        count => format!("Boardify · {count} notifications non lues"),
    }
}

fn handle_menu_event(app: &AppHandle, event: MenuEvent) {
    let id = event.id().as_ref();
    let state = app.state::<TrayState>().0.lock().unwrap().clone();

    match id {
        "open" => {
            focus_main_window(app);
        }
        "quick-add" => quick_add::show(app),
        "tasks" => {
            if let Some(path) = &state.tasks_path {
                open_in_main(app, path);
            }
        }
        "updates" => updater::check(app, true),
        "quit" => app.exit(0),
        _ => {
            let task = id
                .strip_prefix(TASK_PREFIX)
                .and_then(|index| index.parse::<usize>().ok())
                .and_then(|index| state.tasks.get(index));
            if let Some(task) = task {
                open_in_main(app, &task.path);
            }
        }
    }
}

pub fn create(app: &AppHandle) -> tauri::Result<()> {
    let state = DesktopState::default();
    let menu = build_menu(app, &state)?;

    let builder = TrayIconBuilder::with_id(TRAY_ID)
        .tooltip(tooltip(&state))
        .menu(&menu)
        .on_menu_event(handle_menu_event);

    // macOS : icône monochrome adaptée au thème de la barre des menus, menu au clic.
    // Windows et Linux : icône de l'application, le clic gauche ouvre la fenêtre.
    #[cfg(target_os = "macos")]
    let builder = builder
        .icon(tauri::image::Image::from_bytes(include_bytes!(
            "../icons/tray-template.png"
        ))?)
        .icon_as_template(true)
        .show_menu_on_left_click(true);

    #[cfg(not(target_os = "macos"))]
    let builder = builder
        .icon(
            app.default_window_icon()
                .cloned()
                .expect("icône de l'application manquante"),
        )
        .show_menu_on_left_click(false)
        .on_tray_icon_event(|tray, event| {
            use tauri::tray::{MouseButton, MouseButtonState, TrayIconEvent};

            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                focus_main_window(tray.app_handle());
            }
        });

    builder.build(app)?;
    Ok(())
}

#[tauri::command]
pub fn sync_desktop_state(app: AppHandle, state: DesktopState) -> Result<(), String> {
    let menu = build_menu(&app, &state).map_err(|error| error.to_string())?;

    if let Some(tray) = app.tray_by_id(TRAY_ID) {
        let _ = tray.set_menu(Some(menu));
        let _ = tray.set_tooltip(Some(tooltip(&state)));
    }

    // Pastille sur l'icône du Dock (macOS) ou du lanceur (Linux) ; non gérée par Windows.
    if let Some(window) = app.get_webview_window(MAIN_WINDOW) {
        let count = (state.unread > 0).then_some(i64::from(state.unread));
        let _ = window.set_badge_count(count);
    }

    *app.state::<TrayState>().0.lock().unwrap() = state;
    Ok(())
}
