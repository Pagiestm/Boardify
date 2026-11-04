import "server-only";

import type { Collection, Db } from "@/lib/db";
import type { BaseDocument } from "@/lib/db/types";
import type { FileStore } from "@/lib/files";

const deleteByTask = async <T extends BaseDocument & { taskId: string }>(
  collection: Collection<T>,
  taskId: string,
  onDelete?: (document: T) => Promise<unknown>,
) => {
  let documents: T[];
  do {
    ({ documents } = await collection.list({ where: { taskId } as never, limit: 100 }));
    await Promise.all(
      documents.map(async (document) => {
        await onDelete?.(document);
        await collection.delete(document.$id);
      }),
    );
  } while (documents.length === 100);
};

export const deleteTaskRelations = async (db: Db, files: FileStore, taskId: string) => {
  try {
    await Promise.all([
      deleteByTask(db.comments, taskId),
      deleteByTask(db.activities, taskId),
      deleteByTask(db.notifications, taskId),
      deleteByTask(db.checklistItems, taskId),
      deleteByTask(db.attachments, taskId, (attachment) =>
        files.delete(attachment.fileId).catch(() => null),
      ),
      // Collections facultatives : ignorées si elles ne sont pas configurées.
      db.timeEntries.enabled && deleteByTask(db.timeEntries, taskId),
      db.reminders.enabled && deleteByTask(db.reminders, taskId),
      db.pokerVotes.enabled && deleteByTask(db.pokerVotes, taskId),
      // La séance d'estimation porte l'identifiant de la tâche.
      db.pokerSessions.enabled && db.pokerSessions.delete(taskId).catch(() => null),
    ]);
  } catch (error) {
    console.error("Suppression des éléments liés à la tâche impossible", error);
  }
};
