import { Task } from "@/features/tasks/types";

/**
 * Retrouve une tâche à partir de l'identifiant renvoyé par le modèle : les modèles le
 * recopient parfois avec ses crochets, ou donnent le titre à la place.
 */
export const findTask = (tasks: Task[], raw: string) => {
  const key = raw
    .trim()
    .replace(/^\[|\]$/g, "")
    .trim();
  return (
    tasks.find((task) => task.$id === key) ??
    tasks.find((task) => key.includes(task.$id)) ??
    tasks.find((task) => task.name.toLowerCase() === key.toLowerCase())
  );
};

/** Associe les éléments du modèle à leurs tâches, sans doublon. */
export const matchTasks = <T extends { taskId: string }>(tasks: Task[], items: T[]) => {
  const seen = new Set<string>();
  return items.flatMap((item) => {
    const task = findTask(tasks, item.taskId);
    if (!task || seen.has(task.$id)) return [];
    seen.add(task.$id);
    return [{ item, task }];
  });
};
