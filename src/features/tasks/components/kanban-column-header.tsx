import { PlusIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

import { TaskStatus } from "../types";
import { TASK_STATUS_CONFIG } from "../constants";
import { useCreateTaskModal } from "../hooks/use-create-task-modal";

interface KanbanColumnHeaderProps {
    board: TaskStatus;
    taskCount: number;
}

export const KanbanColumnHeader = ({
    board,
    taskCount,
}: KanbanColumnHeaderProps) => {
    const { open } = useCreateTaskModal();
    const config = TASK_STATUS_CONFIG[board];

    return (
        <div className="flex items-center gap-2 px-1 pb-2">
            <span aria-hidden className={cn("size-2 shrink-0 rounded-full", config.dot)} />
            <h2 className="truncate text-sm font-medium">{config.label}</h2>
            <span className="text-xs text-muted-foreground tabular-nums">{taskCount}</span>
            <Button
                variant="ghost"
                size="icon-sm"
                onClick={open}
                className="ml-auto size-7 text-muted-foreground"
                aria-label={`Ajouter une tâche dans ${config.label}`}
            >
                <PlusIcon />
            </Button>
        </div>
    )
}
