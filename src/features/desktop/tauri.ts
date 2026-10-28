type TauriInvoke = (command: string, args?: object) => Promise<unknown>;

type TauriWindow = Window & {
  __TAURI_INTERNALS__?: { invoke: TauriInvoke };
};

/** Fonction `invoke` de Tauri, présente uniquement dans l'application desktop. */
export const getTauriInvoke = (): TauriInvoke | null =>
  typeof window === "undefined"
    ? null
    : ((window as TauriWindow).__TAURI_INTERNALS__?.invoke ?? null);

export const isDesktopApp = () => getTauriInvoke() !== null;
