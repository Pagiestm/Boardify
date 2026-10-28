import "server-only";

import { Query, type Databases, type Storage } from "node-appwrite";

import {
  ACTIVITIES_ID,
  ATTACHMENTS_ID,
  CHECKLIST_ITEMS_ID,
  COMMENTS_ID,
  DATABASE_ID,
  IMAGES_BUCKET_ID,
  NOTIFICATIONS_ID,
} from "@/config";

const deleteByTask = async (
  databases: Databases,
  collectionId: string,
  taskId: string,
  onDelete?: (document: Record<string, unknown>) => Promise<unknown>,
) => {
  let documents;
  do {
    ({ documents } = await databases.listDocuments(DATABASE_ID, collectionId, [
      Query.equal("taskId", taskId),
      Query.limit(100),
    ]));
    await Promise.all(
      documents.map(async (document) => {
        await onDelete?.(document);
        await databases.deleteDocument(DATABASE_ID, collectionId, document.$id);
      }),
    );
  } while (documents.length === 100);
};

export const deleteTaskRelations = async (
  databases: Databases,
  storage: Storage,
  taskId: string,
) => {
  try {
    await Promise.all([
      ...[COMMENTS_ID, ACTIVITIES_ID, NOTIFICATIONS_ID, CHECKLIST_ITEMS_ID].map((collectionId) =>
        deleteByTask(databases, collectionId, taskId),
      ),
      deleteByTask(databases, ATTACHMENTS_ID, taskId, (attachment) =>
        storage.deleteFile(IMAGES_BUCKET_ID, attachment.fileId as string).catch(() => null),
      ),
    ]);
  } catch (error) {
    console.error("Suppression des éléments liés à la tâche impossible", error);
  }
};
