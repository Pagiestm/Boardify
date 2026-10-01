import { useEffect, useRef } from "react";

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
      if (event.defaultPrevented || event.isComposing || typeof event.key !== "string") return;

      const map = bindingsRef.current;
      const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;

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
      const inOverlay =
        event.target instanceof HTMLElement &&
        event.target.closest("[role=dialog],[role=menu],[role=listbox]");
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
