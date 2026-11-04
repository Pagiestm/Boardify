import "server-only";

import type { Db } from "@/lib/db";

/** Supprime les éléments de rétrospective d'un sprint (les tâches créées sont conservées). */
export const deleteSprintRetro = async (db: Db, sprintId: string) => {
  if (!db.retroItems.enabled) return;

  let documents: { $id: string }[];
  do {
    ({ documents } = await db.retroItems.list({ where: { sprintId }, limit: 100 }));
    await Promise.all(documents.map((item) => db.retroItems.delete(item.$id)));
  } while (documents.length === 100);
};
