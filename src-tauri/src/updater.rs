use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Mutex;
use std::time::Duration;

use tauri::{AppHandle, Manager};
use tauri_plugin_dialog::{DialogExt, MessageDialogButtons, MessageDialogKind};
use tauri_plugin_updater::UpdaterExt;

const FIRST_CHECK_DELAY: Duration = Duration::from_secs(10);
const CHECK_INTERVAL: Duration = Duration::from_secs(6 * 60 * 60);

#[derive(Default)]
pub struct UpdateState {
    checking: AtomicBool,
    postponed: Mutex<Option<String>>,
}

async fn ask(app: &AppHandle, title: &str, message: String, buttons: MessageDialogButtons) -> bool {
    let app = app.clone();
    let title = title.to_string();

    tauri::async_runtime::spawn_blocking(move || {
        app.dialog()
            .message(message)
            .title(title)
            .buttons(buttons)
            .blocking_show()
    })
    .await
    .unwrap_or(false)
}

async fn inform(app: &AppHandle, kind: MessageDialogKind, message: String) {
    let app = app.clone();

    let _ = tauri::async_runtime::spawn_blocking(move || {
        app.dialog()
            .message(message)
            .title("Mises à jour")
            .kind(kind)
            .blocking_show()
    })
    .await;
}

async fn run_check(app: &AppHandle, manual: bool) -> tauri_plugin_updater::Result<()> {
    let Some(update) = app.updater()?.check().await? else {
        if manual {
            let version = app.package_info().version.to_string();
            inform(
                app,
                MessageDialogKind::Info,
                format!("Vous utilisez la dernière version de Boardify ({version})."),
            )
            .await;
        }
        return Ok(());
    };

    let state = app.state::<UpdateState>();
    if !manual && state.postponed.lock().unwrap().as_deref() == Some(update.version.as_str()) {
        return Ok(());
    }

    let install = ask(
        app,
        "Mise à jour disponible",
        format!(
            "Boardify {} est disponible (vous avez la {}).\n\nL'installer maintenant ? L'application redémarrera.",
            update.version, update.current_version
        ),
        MessageDialogButtons::OkCancelCustom("Installer".into(), "Plus tard".into()),
    )
    .await;

    if !install {
        *state.postponed.lock().unwrap() = Some(update.version.clone());
        return Ok(());
    }

    update.download_and_install(|_, _| {}, || {}).await?;
    app.restart();
}

pub fn check(app: &AppHandle, manual: bool) {
    let app = app.clone();

    tauri::async_runtime::spawn(async move {
        let state = app.state::<UpdateState>();
        if state.checking.swap(true, Ordering::SeqCst) {
            return;
        }

        let result = run_check(&app, manual).await;
        state.checking.store(false, Ordering::SeqCst);

        if let Err(error) = result {
            eprintln!("Vérification des mises à jour impossible : {error}");
            if manual {
                inform(
                    &app,
                    MessageDialogKind::Error,
                    format!("Impossible de vérifier les mises à jour.\n\n{error}"),
                )
                .await;
            }
        }
    });
}

pub fn schedule(app: &AppHandle) {
    let app = app.clone();

    tauri::async_runtime::spawn(async move {
        tokio::time::sleep(FIRST_CHECK_DELAY).await;
        loop {
            check(&app, false);
            tokio::time::sleep(CHECK_INTERVAL).await;
        }
    });
}
