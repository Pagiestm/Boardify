fn main() {
    tauri_build::try_build(
        tauri_build::Attributes::new()
            .app_manifest(tauri_build::AppManifest::new().commands(&["sync_desktop_state"])),
    )
    .expect("erreur de build Tauri");
}
