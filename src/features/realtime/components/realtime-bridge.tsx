"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";

import { RealtimeChange, RealtimeTopic } from "../types";
import { setRealtimeConnected } from "../store";

/** Données à rafraîchir pour chaque type de changement. */
const QUERIES: Record<RealtimeTopic, string[][]> = {
  tasks: [["tasks"], ["task"], ["workspace-analytics"], ["project-analytics"]],
  comments: [["comments"], ["activities"]],
  activities: [["activities"]],
  checklist: [["checklist"], ["tasks"]],
  attachments: [["attachments"]],
  sprints: [["sprints"]],
  projects: [["projects"], ["project"], ["project-analytics"]],
  members: [["members"], ["workspace-analytics"]],
  labels: [["labels"]],
  workspaces: [["workspaces"], ["workspace"], ["workspace-info"]],
  "saved-views": [["saved-views"]],
  templates: [["templates"]],
  notifications: [["notifications"]],
};

/** Regroupe les changements reçus en rafale avant de rafraîchir. */
const BATCH_MS = 250;
const RETRY_MS = 3_000;

/**
 * Écoute les changements de l'espace ouvert et rafraîchit aussitôt les données concernées,
 * pour voir les modifications des autres membres sans attendre.
 */
export const RealtimeBridge = () => {
  const workspaceId = useWorkspaceId();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!workspaceId) return;

    let source: EventSource | null = null;
    let retry: ReturnType<typeof setTimeout> | undefined;
    let flush: ReturnType<typeof setTimeout> | undefined;
    let stopped = false;
    const pending = new Set<RealtimeTopic>();

    const refresh = () => {
      flush = undefined;
      for (const topic of pending) {
        for (const queryKey of QUERIES[topic]) queryClient.invalidateQueries({ queryKey });
      }
      pending.clear();
    };

    const connect = () => {
      source = new EventSource(`/api/realtime?workspaceId=${encodeURIComponent(workspaceId)}`);
      source.addEventListener("ready", () => setRealtimeConnected(true));
      source.addEventListener("change", (event) => {
        try {
          const change = JSON.parse((event as MessageEvent<string>).data) as RealtimeChange;
          if (!QUERIES[change.topic]) return;
          pending.add(change.topic);
          flush ??= setTimeout(refresh, BATCH_MS);
        } catch {
          // Message illisible : ignoré.
        }
      });
      // Le serveur ferme le flux régulièrement : on se reconnecte, et on rattrape
      // ce qui a pu changer entre-temps.
      source.addEventListener("error", () => {
        setRealtimeConnected(false);
        source?.close();
        if (stopped) return;
        retry = setTimeout(() => {
          for (const topic of Object.keys(QUERIES) as RealtimeTopic[]) pending.add(topic);
          refresh();
          connect();
        }, RETRY_MS);
      });
    };

    connect();
    return () => {
      stopped = true;
      setRealtimeConnected(false);
      source?.close();
      clearTimeout(retry);
      clearTimeout(flush);
    };
  }, [workspaceId, queryClient]);

  return null;
};
