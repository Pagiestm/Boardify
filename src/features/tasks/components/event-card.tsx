import React from "react";
import { useRouter } from "next/navigation";

import { Member } from "@/features/members/types";
import { Project } from "@/features/projects/types";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";

import { cn } from "@/lib/utils";

import { TaskStatus } from "../types";
import { TASK_STATUS_CONFIG } from "../constants";

interface EventCardProps {
    title: string;
    assignee?: Member;
    project?: Project;
    status: TaskStatus;
    id: string;
}

export const EventCard = ({
    title,
    assignee,
    project,
    status,
    id,
}: EventCardProps) => {
    const workspaceId = useWorkspaceId()
    const router = useRouter()
    const config = TASK_STATUS_CONFIG[status]

    const onClick = (
        e: React.MouseEvent<HTMLButtonElement>
    ) => {
        e.stopPropagation()

        router.push(`/workspaces/${workspaceId}/tasks/${id}`)
    }

    const meta = [
        config?.label,
        assignee?.name,
        project?.name,
    ].filter(Boolean).join(" · ")

    return (
        <div className="px-1">
            <button
                type="button"
                onClick={onClick}
                title={`${title}${meta ? ` — ${meta}` : ""}`}
                className={cn(
                    "flex w-full items-center rounded-sm border-l-2 bg-muted px-1.5 py-0.5 text-left text-xs text-foreground transition-colors",
                    "hover:bg-accent",
                    config?.border,
                    status === TaskStatus.DONE && "text-muted-foreground line-through"
                )}
            >
                <span className="truncate">{title}</span>
            </button>
        </div>
    )
}
