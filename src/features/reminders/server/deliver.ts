import "server-only";

import { getMember } from "@/features/members/utils";
import { NotificationType } from "@/features/notifications/types";

import { isConflict, type Db } from "@/lib/db";

const BATCH = 50;

/**
 * Transforme les rappels échus de l'utilisateur en notifications. Appelé à chaque lecture des
 * notifications : pas besoin de tâche planifiée. Le rappel est marqué envoyé avant la création, et
 * la notification reprend son identifiant : deux lectures simultanées ne créent pas de doublon.
 */
export const deliverDueReminders = async (db: Db, userId: string) => {
  if (!db.reminders.enabled) return;

  try {
    const { documents } = await db.reminders.list({
      where: { userId, sent: false, remindAt: { lte: new Date().toISOString() } },
      orderBy: { remindAt: "asc" },
      limit: BATCH,
    });

    for (const reminder of documents) {
      await db.reminders.update(reminder.$id, { sent: true });

      // Plus membre de l'espace : le rappel est abandonné.
      const member = await getMember({ db, workspaceId: reminder.workspaceId, userId });
      if (!member) continue;

      await db.notifications
        .create(
          {
            workspaceId: reminder.workspaceId,
            userId,
            taskId: reminder.taskId,
            actorId: null,
            type: NotificationType.REMINDER,
            read: false,
          },
          reminder.$id,
        )
        .catch((error) => {
          if (!isConflict(error)) throw error;
        });
    }
  } catch (error) {
    console.error("Envoi des rappels impossible", error);
  }
};
