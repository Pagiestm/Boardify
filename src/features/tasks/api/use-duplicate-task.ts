import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { client } from "@/lib/rpc";

interface DuplicateTaskVariables {
  taskId: string;
}

export const useDuplicateTask = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<{ $id: string }, Error, DuplicateTaskVariables>({
    mutationFn: async ({ taskId }) => {
      const source = await client.api.tasks[":taskId"].$get({ param: { taskId } });

      if (!source.ok) {
        throw new Error("Erreur lors de la duplication de la tâche");
      }

      const { data: task } = await source.json();

      const created = await client.api.tasks["$post"]({
        json: {
          name: `${task.name} (copie)`,
          status: task.status,
          workspaceId: task.workspaceId,
          projectId: task.projectId,
          assigneeId: task.assigneeId,
          dueDate: task.dueDate,
          priority: task.priority,
          description: task.description ?? undefined,
        },
      });

      if (!created.ok) {
        throw new Error("Erreur lors de la duplication de la tâche");
      }

      const { data } = await created.json();
      return { $id: data.$id };
    },
    onSuccess: () => {
      toast.success("Tâche dupliquée");

      queryClient.invalidateQueries({ queryKey: ["project-analytics"] });
      queryClient.invalidateQueries({ queryKey: ["workspace-analytics"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: () => {
      toast.error("Erreur lors de la duplication de la tâche");
    },
  });

  return mutation;
};
