import { PRIVATE_TOPICS } from "@/lib/db/changes";

import type { RealtimeChange } from "../types";
import type { RealtimeEvent } from "./types";

/**
 * Changement à transmettre à un abonné, ou null s'il ne le concerne pas : seuls les changements
 * de son espace passent, et les notifications et rappels seulement pour leur destinataire.
 */
export const toRealtimeChange = (
  event: RealtimeEvent,
  { workspaceId, userId }: { workspaceId: string; userId: string },
): RealtimeChange | null => {
  if (event.workspaceId !== workspaceId) return null;
  if (PRIVATE_TOPICS.includes(event.topic) && event.userId !== userId) return null;
  return { topic: event.topic, taskId: event.taskId };
};
