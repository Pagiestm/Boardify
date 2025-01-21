import { PencilIcon } from "lucide-react";

import { MemberAvatar } from "@/features/members/components/member-avatar";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { snakeCaseToTitleCase } from "@/lib/utils";
import { DottedSeparator } from "@/components/dotted-separator";

import { TaskDate } from "./task-date";
import { OverviewProperty } from "./overview-property";

import { Task } from "../types";
import { useEditTaskModal } from "../hooks/use-edit-task-modal";

interface TaskOverviewProps {
    task: Task;
}

export const TaskOverview = ({
    task
}: TaskOverviewProps) => {
    const { open } = useEditTaskModal();

    return (
        <div className="flex flex-col gap-y-4 col-span-1">
            <div className="bg-muted rounded-lg p-4">
                <div className="flex items-center justify-between">
                    <p className="text-lg font-semibold">Aperçu</p>
                    <Button onClick={() => open(task.$id)} size="sm" variant="secondary">
                        <PencilIcon className="size-4 mr-2" />
                        Éditer
                    </Button>
                </div>
                <DottedSeparator className="my-4" />
                <div className="flex flex-col gap-y-4">
                    <OverviewProperty label="Assigné à">
                        <MemberAvatar
                            name={task.assignee.name}
                            className="size-6"
                        />
                        <p className="text-sm font-medium">{task.assignee.name}</p>
                    </OverviewProperty>
                    <OverviewProperty label="Date d'échéance">
                        <TaskDate value={task.dueDate} className="text-sm font-medium" />
                    </OverviewProperty>
                    <OverviewProperty label="Statut">
                        <Badge variant={task.status}>
                            {snakeCaseToTitleCase(task.status)}
                        </Badge>
                    </OverviewProperty>
                </div>
            </div>
        </div>
    )
}