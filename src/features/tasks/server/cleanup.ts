import "server-only";

import { Query, type Databases } from "node-appwrite";

import { ACTIVITIES_ID, COMMENTS_ID, DATABASE_ID, NOTIFICATIONS_ID } from "@/config";

const deleteByTask = async (databases: Databases, collectionId: string, taskId: string) => {
  let documents;
  do {
    ({ documents } = await databases.listDocuments(DATABASE_ID, collectionId, [
      Query.equal("taskId", taskId),
      Query.limit(100),
    ]));
    await Promise.all(
      documents.map((document) =>
        databases.deleteDocument(DATABASE_ID, collectionId, document.$id),
      ),
    );
  } while (documents.length === 100);
};

export const deleteTaskRelations = async (databases: Databases, taskId: string) => {
  try {
    await Promise.all(
      [COMMENTS_ID, ACTIVITIES_ID, NOTIFICATIONS_ID].map((collectionId) =>
        deleteByTask(databases, collectionId, taskId),
      ),
    );
  } catch (error) {
    console.error("Suppression des commentaires et de l'activité impossible", error);
  }
};
