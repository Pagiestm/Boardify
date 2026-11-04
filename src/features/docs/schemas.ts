import { z } from "zod";

export const DOC_TITLE_MAX = 200;
export const DOC_CONTENT_MAX = 100_000;
export const DOC_TASKS_MAX = 50;

const title = z.string().trim().min(1, "Requis").max(DOC_TITLE_MAX);
const content = z.string().max(DOC_CONTENT_MAX, "Page trop longue");
const taskIds = z.array(z.string().min(1).max(36)).max(DOC_TASKS_MAX);

export const createDocSchema = z.object({
  projectId: z.string().min(1),
  title,
  content: content.optional(),
  taskIds: taskIds.optional(),
});

export const updateDocSchema = z
  .object({ title, content, taskIds })
  .partial()
  .refine((values) => Object.values(values).some((value) => value !== undefined), {
    message: "Aucune modification",
  });

/** Pages dont le titre contient la recherche, sans tenir compte des majuscules ni des accents. */
export const filterDocsByTitle = <T extends { title: string }>(docs: T[], search: string) => {
  const normalize = (value: string) =>
    value
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .toLowerCase();
  const query = normalize(search.trim());
  return query ? docs.filter((doc) => normalize(doc.title).includes(query)) : docs;
};
