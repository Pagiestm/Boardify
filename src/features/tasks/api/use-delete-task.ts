import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

import {
  UNDO_DELAY_MS,
  cancelTaskDelete,
  scheduleTaskDelete,
  sendTaskDelete,
} from "../pending-deletes";

/**
 * Supprime une tâche avec la possibilité d'annuler : elle disparaît aussitôt, et un message
 * propose « Annuler » pendant quelques secondes avant la suppression réelle.
 */
export const useDeleteTaskWithUndo = () => {
  const queryClient = useQueryClient();

  return (task: { $id: string; name: string }) => {
    const refresh = () => {
      queryClient.invalidateQueries({ queryKey: ["project-analytics"] });
      queryClient.invalidateQueries({ queryKey: ["workspace-analytics"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["task", task.$id] });
    };

    scheduleTaskDelete(task.$id, async () => {
      const response = await sendTaskDelete(task.$id).catch(() => null);
      if (!response?.ok) toast.error("Erreur lors de la suppression de la tâche");
      refresh();
    });

    toast("Tâche supprimée", {
      description: task.name,
      duration: UNDO_DELAY_MS,
      action: {
        label: "Annuler",
        onClick: () => {
          if (cancelTaskDelete(task.$id)) toast.success("Suppression annulée");
        },
      },
    });
  };
};
