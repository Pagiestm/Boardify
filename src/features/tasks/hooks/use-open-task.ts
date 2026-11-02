"use client";

import { useRouter } from "next/navigation";

/** Éléments interactifs d'une carte ou d'une ligne : un clic dessus n'ouvre pas la tâche. */
const INTERACTIVE = "a, button, input, textarea, select, label, [role=menuitem], [role=checkbox]";

/**
 * Ouvre la page d'une tâche au clic sur sa carte ou sa ligne. ⌘/Ctrl + clic ou clic du milieu
 * l'ouvrent dans un nouvel onglet. Le clic de fin d'un glisser-déposer est ignoré.
 */
export const useOpenTask = () => {
  const router = useRouter();

  return (task: { $id: string; workspaceId: string }, event: React.MouseEvent) => {
    if (event.defaultPrevented) return;
    // Clic dans un menu ou une fenêtre ouverts depuis la carte (rendus ailleurs dans la page).
    if (!event.currentTarget.contains(event.target as Node)) return;
    if ((event.target as HTMLElement).closest(INTERACTIVE)) return;
    if (window.getSelection()?.toString()) return;

    const href = `/workspaces/${task.workspaceId}/tasks/${task.$id}`;
    if (event.metaKey || event.ctrlKey || event.button === 1) {
      window.open(href, "_blank", "noopener");
      return;
    }
    router.push(href);
  };
};
