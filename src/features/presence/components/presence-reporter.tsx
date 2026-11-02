"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

import { client } from "@/lib/rpc";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";

const HEARTBEAT_MS = 25_000;

/** Signale aux autres membres la page ouverte, tant que l'onglet est visible. */
export const PresenceReporter = () => {
  const workspaceId = useWorkspaceId();
  const pathname = usePathname();

  useEffect(() => {
    if (!workspaceId) return;
    let disabled = false;

    const report = async () => {
      if (disabled || document.visibilityState !== "visible") return;
      const response = await client.api.presence
        .$put({ json: { workspaceId, location: pathname } })
        .catch(() => null);
      // Collection absente : la présence est désactivée, inutile d'insister.
      const body = response?.ok
        ? ((await response.json()) as { data?: { enabled?: boolean } })
        : null;
      if (body?.data?.enabled === false) disabled = true;
    };
    const leave = () => {
      if (disabled) return;
      void fetch(`/api/presence?workspaceId=${encodeURIComponent(workspaceId)}`, {
        method: "DELETE",
        credentials: "same-origin",
        keepalive: true,
      });
    };
    const onVisibility = () => (document.visibilityState === "visible" ? report() : leave());

    void report();
    const interval = setInterval(report, HEARTBEAT_MS);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", leave);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", leave);
    };
  }, [workspaceId, pathname]);

  return null;
};
