"use client";

import { useEffect, useRef } from "react";

import { NotificationType } from "../types";
import { describeNotification } from "../utils";

interface DesktopNotification {
  $id: string;
  type: NotificationType;
  read: boolean;
  taskName: string;
  actorName: string | null;
}

type TauriWindow = Window & {
  __TAURI_INTERNALS__?: { invoke: (command: string, args?: object) => Promise<unknown> };
};

const MAX_NATIVE_NOTIFICATIONS = 3;

const showNativeNotifications = async (
  invoke: NonNullable<TauriWindow["__TAURI_INTERNALS__"]>["invoke"],
  notifications: DesktopNotification[],
) => {
  const granted =
    (await invoke("plugin:notification|is_permission_granted")) === true ||
    (await invoke("plugin:notification|request_permission")) === "granted";
  if (!granted) return;

  for (const notification of notifications.slice(0, MAX_NATIVE_NOTIFICATIONS)) {
    await invoke("plugin:notification|notify", {
      options: {
        title: "Boardify",
        body: describeNotification(
          notification.type,
          notification.actorName ?? "Quelqu'un",
          notification.taskName,
        ),
      },
    });
  }
};

export const useDesktopNotifications = (notifications?: DesktopNotification[]) => {
  const seen = useRef<Set<string> | null>(null);

  useEffect(() => {
    if (!notifications) return;

    if (seen.current === null) {
      seen.current = new Set(notifications.map((notification) => notification.$id));
      return;
    }

    const known = seen.current;
    const fresh = notifications.filter(
      (notification) => !notification.read && !known.has(notification.$id),
    );
    notifications.forEach((notification) => known.add(notification.$id));

    const invoke = (window as TauriWindow).__TAURI_INTERNALS__?.invoke;
    if (!invoke || fresh.length === 0) return;

    showNativeNotifications(invoke, fresh).catch((error) =>
      console.error("Notification native impossible", error),
    );
  }, [notifications]);
};
