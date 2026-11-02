/** Texte comparable sans tenir compte des majuscules ni des accents. */
export const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

export const MAX_TASK_RESULTS = 8;

/** Tâches dont le nom contient le texte saisi (à partir de 2 caractères). */
export const searchTasks = <T extends { name: string }>(tasks: T[], search: string) => {
  const query = normalize(search.trim());
  if (query.length < 2) return [];
  return tasks.filter((task) => normalize(task.name).includes(query)).slice(0, MAX_TASK_RESULTS);
};
