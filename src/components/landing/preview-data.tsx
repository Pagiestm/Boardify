import { CalendarIcon } from "lucide-react";

import { cn, getAvatarColor, getInitial } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

import { TaskPriority, TaskStatus } from "@/features/tasks/types";
import { TASK_PRIORITY_CONFIG, TASK_STATUS_CONFIG, TASK_STATUS_ORDER } from "@/features/tasks/constants";

export interface SampleTask {
    id: string;
    name: string;
    status: TaskStatus;
    priority: TaskPriority;
    assignee: string;
    project: string;
    /** Day of month in the sample month */
    day: number;
}

/** Illustrative data for the product previews. */
export const SAMPLE_TASKS: SampleTask[] = [
    { id: "t1", name: "Rédiger le cahier des charges", status: TaskStatus.DONE, priority: TaskPriority.HIGH, assignee: "Léa", project: "Site vitrine", day: 3 },
    { id: "t2", name: "Maquettes de la page d'accueil", status: TaskStatus.IN_REVIEW, priority: TaskPriority.MEDIUM, assignee: "Hugo", project: "Site vitrine", day: 8 },
    { id: "t3", name: "Intégration du paiement", status: TaskStatus.IN_PROGRESS, priority: TaskPriority.HIGH, assignee: "Sam", project: "App mobile", day: 12 },
    { id: "t4", name: "Configurer l'authentification", status: TaskStatus.IN_PROGRESS, priority: TaskPriority.MEDIUM, assignee: "Léa", project: "App mobile", day: 14 },
    { id: "t5", name: "Écrire la FAQ", status: TaskStatus.TODO, priority: TaskPriority.LOW, assignee: "Hugo", project: "Site vitrine", day: 18 },
    { id: "t6", name: "Préparer la mise en ligne", status: TaskStatus.TODO, priority: TaskPriority.HIGH, assignee: "Sam", project: "Site vitrine", day: 22 },
    { id: "t7", name: "Audit SEO", status: TaskStatus.BACKLOG, priority: TaskPriority.LOW, assignee: "Léa", project: "Site vitrine", day: 27 },
];

export const PREVIEW_STATUSES = TASK_STATUS_ORDER.filter((status) => status !== TaskStatus.BACKLOG);

export const MiniAvatar = ({ name, className }: { name: string; className?: string }) => (
    <span
        aria-hidden
        className={cn(
            "inline-flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold",
            getAvatarColor(name),
            className
        )}
    >
        {getInitial(name)}
    </span>
);

export const StatusLabel = ({ status }: { status: TaskStatus }) => (
    <span className="flex items-center gap-2 text-xs font-medium">
        <span className={cn("size-2 rounded-full", TASK_STATUS_CONFIG[status].dot)} />
        {TASK_STATUS_CONFIG[status].label}
    </span>
);

export const PreviewTaskCard = ({ task }: { task: SampleTask }) => (
    <div className="rounded-md border bg-card p-2.5 shadow-xs">
        <p className="text-[13px] leading-snug font-medium">{task.name}</p>
        <div className="mt-2.5 flex items-center justify-between gap-2">
            <Badge variant={task.priority}>{TASK_PRIORITY_CONFIG[task.priority].label}</Badge>
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1">
                    <CalendarIcon className="size-3" />
                    {task.day} oct.
                </span>
                <MiniAvatar name={task.assignee} />
            </div>
        </div>
    </div>
);

export const PreviewKanban = ({ className }: { className?: string }) => (
    <div className={cn("grid min-w-[640px] grid-cols-4 gap-3", className)}>
        {PREVIEW_STATUSES.map((status) => {
            const tasks = SAMPLE_TASKS.filter((task) => task.status === status);

            return (
                <div key={status} className="flex flex-col gap-2 rounded-lg bg-muted/60 p-2">
                    <div className="flex items-center justify-between px-1 py-0.5">
                        <StatusLabel status={status} />
                        <span className="text-xs text-muted-foreground">{tasks.length}</span>
                    </div>
                    {tasks.map((task) => (
                        <PreviewTaskCard key={task.id} task={task} />
                    ))}
                </div>
            );
        })}
    </div>
);
