import { useRouter } from "next/navigation";
import { CopyIcon, ExternalLinkIcon, FolderIcon, PencilIcon, TrashIcon } from "lucide-react";

import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useDeleteTaskWithUndo } from "../api/use-delete-task";
import { useDuplicateTask } from "../api/use-duplicate-task";
import { useEditTaskModal } from "../hooks/use-edit-task-modal";

interface TaskActionsProps {
  id: string;
  name: string;
  projectId: string;
  children: React.ReactNode;
}

export const TaskActions = ({ id, name, projectId, children }: TaskActionsProps) => {
  const workspaceId = useWorkspaceId();
  const router = useRouter();

  const { open } = useEditTaskModal();

  const deleteTask = useDeleteTaskWithUndo();
  const { mutate: duplicate, isPending: isDuplicating } = useDuplicateTask();

  const onDelete = () => deleteTask({ $id: id, name });

  const onOpenTask = () => {
    router.push(`/workspaces/${workspaceId}/tasks/${id}`);
  };

  const onOpenProject = () => {
    router.push(`/workspaces/${workspaceId}/projects/${projectId}`);
  };

  return (
    <div className="flex justify-end">
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={onOpenTask}>
            <ExternalLinkIcon className="text-muted-foreground" />
            Voir la tâche
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onOpenProject}>
            <FolderIcon className="text-muted-foreground" />
            Voir le projet
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => open(id)}>
            <PencilIcon className="text-muted-foreground" />
            Modifier
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => duplicate({ taskId: id })} disabled={isDuplicating}>
            <CopyIcon className="text-muted-foreground" />
            Dupliquer
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={onDelete}>
            <TrashIcon />
            Supprimer
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
