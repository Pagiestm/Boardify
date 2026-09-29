import { useEffect, useRef } from "react";

/**
 * Global keyboard bindings.
 *
 * Supported key formats:
 * - single key: "n", "p", "?"
 * - sequence (vim/gmail style): "g h" — second key within 1s
 * - modifier combo: "mod+k" (⌘ on macOS, Ctrl elsewhere)
 *
 * Single keys and sequences are ignored while the user types in a field.
 */
export type HotkeyMap = Record<string, (event: KeyboardEvent) => void>;

const SEQUENCE_TIMEOUT = 1000;

const isEditableTarget = (target: EventTarget | null) => {
    if (!(target instanceof HTMLElement)) return false;
    const tag = target.tagName;
    return (
        target.isContentEditable ||
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        target.getAttribute("role") === "combobox"
    );
};

export const useHotkeys = (bindings: HotkeyMap, enabled = true) => {
    // Keep the latest bindings without re-subscribing the listener each render.
    const bindingsRef = useRef(bindings);
    useEffect(() => {
        bindingsRef.current = bindings;
    });

    useEffect(() => {
        if (!enabled) return;

        let pending: string | null = null;
        let pendingTimer: ReturnType<typeof setTimeout> | undefined;

        const clearPending = () => {
            pending = null;
            clearTimeout(pendingTimer);
        };

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.defaultPrevented || event.isComposing) return;

            const map = bindingsRef.current;
            const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;

            // Modifier combos work everywhere, even inside inputs.
            if (event.metaKey || event.ctrlKey) {
                const handler = map[`mod+${key}`];
                if (handler) {
                    event.preventDefault();
                    clearPending();
                    handler(event);
                }
                return;
            }

            if (event.altKey || isEditableTarget(event.target)) return;
            // Ignore keys typed while a dialog/menu has focus, except "?" (help).
            const inOverlay = event.target instanceof HTMLElement && event.target.closest("[role=dialog],[role=menu],[role=listbox]");
            if (inOverlay && key !== "?") return;

            if (pending) {
                const handler = map[`${pending} ${key}`];
                clearPending();
                if (handler) {
                    event.preventDefault();
                    handler(event);
                }
                return;
            }

            const startsSequence = Object.keys(map).some((combo) => combo.startsWith(`${key} `));
            if (startsSequence) {
                pending = key;
                pendingTimer = setTimeout(clearPending, SEQUENCE_TIMEOUT);
                return;
            }

            const handler = map[key];
            if (handler) {
                event.preventDefault();
                handler(event);
            }
        };

        window.addEventListener("keydown", onKeyDown);
        return () => {
            window.removeEventListener("keydown", onKeyDown);
            clearPending();
        };
    }, [enabled]);
};
