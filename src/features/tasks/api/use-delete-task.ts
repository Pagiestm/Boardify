import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

import {
  UNDO_DELAY_MS,
  cancelTaskDelete,
  scheduleTaskDelete,
  sendTaskDelete,
} from "../pending-deletes";

type DeletableTask = { $id: string; name: string };

/**
 * Supprime une ou plusieurs tâches avec la possibilité d'annuler : elles disparaissent aussitôt,
 * et un message propose « Annuler » pendant quelques secondes avant la suppression réelle.
 */
export const useDeleteTaskWithUndo = () => {
  const queryClient = useQueryClient();

  return (input: DeletableTask | DeletableTask[]) => {
    const tasks = Array.isArray(input) ? input : [input];
    if (tasks.length === 0) return;

    const refresh = () => {
      queryClient.invalidateQueries({ queryKey: ["project-analytics"] });
      queryClient.invalidateQueries({ queryKey: ["workspace-analytics"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["task"] });
      queryClient.invalidateQueries({ queryKey: ["sprints"] });
    };

    let failed = 0;
    let remaining = tasks.length;
    for (const task of tasks) {
      scheduleTaskDelete(task.$id, async () => {
        const response = await sendTaskDelete(task.$id).catch(() => null);
        if (!response?.ok) failed++;
        if (--remaining === 0) {
          if (failed) toast.error("Erreur lors de la suppression de la tâche");
          refresh();
        }
      });
    }

    const count = tasks.length;
    toast(count > 1 ? `${count} tâches supprimées` : "Tâche supprimée", {
      description: count > 1 ? undefined : tasks[0].name,
      duration: UNDO_DELAY_MS,
      action: {
        label: "Annuler",
        onClick: () => {
          const restored = tasks.filter((task) => cancelTaskDelete(task.$id)).length;
          if (restored) toast.success("Suppression annulée");
        },
      },
    });
  };
};
