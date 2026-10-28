"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { endOfDay, startOfDay } from "date-fns";

import { useCurrent } from "@/features/auth/api/use-current";
import { useGetMembers } from "@/features/members/api/use-get-members";
import { useGetNotifications } from "@/features/notifications/api/use-get-notifications";
import { PopulatedTask } from "@/features/tasks/types";
import { isTaskDone } from "@/features/tasks/utils";

import { client } from "@/lib/rpc";

import { getTauriInvoke, isDesktopApp } from "../tauri";

const TODAY_REFRESH_MS = 60_000;

interface TrayTask {
  title: string;
  path: string;
  overdue: boolean;
}

interface DesktopState {
  unread: number;
  tasks: TrayTask[];
  tasksPath: string | null;
}

const useTodayTasks = (workspaceId: string | undefined) => {
  const { data: user } = useCurrent();
  const { data: members } = useGetMembers({
    workspaceId: workspaceId ?? "",
    enabled: Boolean(workspaceId),
  });
  const memberId = members?.documents.find((member) => member.userId === user?.$id)?.$id;

  const { data: tasks } = useQuery({
    queryKey: ["desktop-today", workspaceId, memberId],
    enabled: Boolean(workspaceId && memberId),
    refetchInterval: TODAY_REFRESH_MS,
    refetchIntervalInBackground: true,
    queryFn: async () => {
      const response = await client.api.tasks.$get({
        query: { workspaceId: workspaceId!, assigneeId: memberId! },
      });
      if (!response.ok) return null;

      const { data } = await response.json();
      return data.documents as PopulatedTask[];
    },
  });

  if (!workspaceId || !memberId || !tasks) return null;

  const now = new Date();
  const startOfToday = startOfDay(now);
  const endOfToday = endOfDay(now);
  const today = tasks
    .filter((task) => !isTaskDone(task) && task.dueDate && new Date(task.dueDate) <= endOfToday)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .map((task): TrayTask => ({
      title: task.name,
      path: `/workspaces/${workspaceId}/tasks/${task.$id}`,
      overdue: new Date(task.dueDate) < startOfToday,
    }));

  return {
    tasks: today,
    tasksPath: `/workspaces/${workspaceId}/tasks?assigneeId=${memberId}`,
  };
};

const DesktopSync = () => {
  const params = useParams<{ workspaceId?: string }>();
  const { data: notifications } = useGetNotifications();
  const today = useTodayTasks(params.workspaceId);
  const lastSent = useRef<string | null>(null);

  const unread = notifications?.unreadCount ?? 0;

  useEffect(() => {
    const invoke = getTauriInvoke();
    if (!invoke || !notifications) return;

    const state: DesktopState = {
      unread,
      tasks: today?.tasks ?? [],
      tasksPath: today?.tasksPath ?? null,
    };
    const serialized = JSON.stringify(state);
    if (serialized === lastSent.current) return;

    lastSent.current = serialized;
    invoke("sync_desktop_state", { state }).catch((error) =>
      console.error("Synchronisation avec l'application desktop impossible", error),
    );
  }, [notifications, unread, today]);

  return null;
};

/** Transmet à l'application desktop la pastille du Dock et les tâches du jour du menu. */
const subscribe = () => () => {};

export const DesktopBridge = () => {
  const isDesktop = useSyncExternalStore(subscribe, isDesktopApp, () => false);

  return isDesktop ? <DesktopSync /> : null;
};
