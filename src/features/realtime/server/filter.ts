import type { RealtimeChange } from "../types";
import type { RealtimeEvent } from "./types";

/**
 * Changement à transmettre à un abonné, ou null s'il ne le concerne pas : seuls les changements
 * de son espace passent, et les notifications seulement pour leur destinataire.
 */
export const toRealtimeChange = (
  event: RealtimeEvent,
  { workspaceId, userId }: { workspaceId: string; userId: string },
): RealtimeChange | null => {
  if (event.workspaceId !== workspaceId) return null;
  if (event.topic === "notifications" && event.userId !== userId) return null;
  return { topic: event.topic, taskId: event.taskId };
};
