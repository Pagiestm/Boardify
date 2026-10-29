"use client";

import { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { FaGithub } from "react-icons/fa";
import { MoreHorizontalIcon, PencilIcon, SparklesIcon, Trash2Icon } from "lucide-react";

import { useCurrent } from "@/features/auth/api/use-current";
import { useGetLabels } from "@/features/labels/api/use-get-labels";
import { useGetMembers } from "@/features/members/api/use-get-members";
import { useGetProjects } from "@/features/projects/api/use-get-projects";
import { parseBoardColumns } from "@/features/projects/utils";
import { MemberRole } from "@/features/members/types";
import { MemberAvatar } from "@/features/members/components/member-avatar";
import { ActivityChange, ActivityType } from "@/features/activities/types";
import { useGetActivities } from "@/features/activities/api/use-get-activities";
import { GITHUB_AUTHOR_PREFIX } from "@/features/comments/types";
import { useGetComments } from "@/features/comments/api/use-get-comments";
import { useCreateComment } from "@/features/comments/api/use-create-comment";
import { useUpdateComment } from "@/features/comments/api/use-update-comment";
import { useDeleteComment } from "@/features/comments/api/use-delete-comment";
import { CommentContent } from "@/features/comments/components/comment-content";
import { CommentComposer } from "@/features/comments/components/comment-composer";
import { useAssistantReady } from "@/features/assistant/api/use-assistant";
import {
  DiscussionSummary,
  suggestReply,
} from "@/features/assistant/components/discussion-assistant";

import { TimeAgo } from "@/components/time-ago";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useConfirm } from "@/hooks/use-confirm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useGetTasks } from "../api/use-get-tasks";
import { useGetSprints } from "@/features/sprints/api/use-sprints";
import { PopulatedTask, TaskPriority, TaskRecurrence } from "../types";
import { TASK_PRIORITY_CONFIG, TASK_RECURRENCE_LABELS } from "../constants";

interface TaskActivityProps {
  task: PopulatedTask;
}

const formatDay = (value?: string) =>
  value ? format(new Date(value), "d MMM", { locale: fr }) : "—";

const EDIT_THRESHOLD = 10_000;

const isEdited = (createdAt: string, updatedAt: string) =>
  new Date(updatedAt).getTime() - new Date(createdAt).getTime() > EDIT_THRESHOLD;

const parseChange = (data?: string | null): ActivityChange => {
  try {
    return data ? (JSON.parse(data) as ActivityChange) : {};
  } catch {
    return {};
  }
};

const Strong = ({ children }: { children: React.ReactNode }) => (
  <span className="font-medium text-foreground">{children}</span>
);

export const TaskActivity = ({ task }: TaskActivityProps) => {
  const { data: current } = useCurrent();
  const { data: comments, isLoading: isLoadingComments } = useGetComments({ taskId: task.$id });
  const assistantReady = useAssistantReady(task.workspaceId);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const commentCount = comments?.length ?? 0;
  const { data: activities, isLoading: isLoadingActivities } = useGetActivities({
    taskId: task.$id,
  });
  const { data: members } = useGetMembers({ workspaceId: task.workspaceId });
  const { data: labels } = useGetLabels({ workspaceId: task.workspaceId });
  const { data: projects } = useGetProjects({ workspaceId: task.workspaceId });
  const { data: tasks } = useGetTasks({ workspaceId: task.workspaceId });
  const { data: sprints } = useGetSprints({ projectId: task.projectId });
  const { mutate: createComment, isPending: isCreating } = useCreateComment();
  const { mutate: updateComment, isPending: isUpdating } = useUpdateComment();
  const { mutate: deleteComment } = useDeleteComment();
  const [editingId, setEditingId] = useState<string | null>(null);

  const [DeleteDialog, confirmDelete] = useConfirm(
    "Supprimer le commentaire",
    "Le commentaire sera aussi supprimé de l'issue GitHub liée.",
    "destructive",
  );

  const memberList = members?.documents ?? [];
  const memberNames = new Map(memberList.map((member) => [member.$id, member.name]));
  const currentMember = memberList.find((member) => member.userId === current?.$id);
  const columns = parseBoardColumns(task.project?.columnConfig);
  const columnLabel = (id?: unknown) =>
    columns.find((column) => column.id === id)?.label ?? String(id ?? "—");
  const labelName = (id: string) =>
    labels?.documents.find((label) => label.$id === id)?.name ?? "étiquette supprimée";
  const projectName = (id?: unknown) =>
    projects?.documents.find((project) => project.$id === id)?.name ?? "un autre projet";
  const memberName = (id?: unknown) =>
    (typeof id === "string" && memberNames.get(id)) || "quelqu'un";
  const taskName = (id: string) =>
    tasks?.documents.find((item) => item.$id === id)?.name ?? "une tâche supprimée";
  const sprintName = (id?: unknown) =>
    sprints?.find((sprint) => sprint.$id === id)?.name ?? "un sprint supprimé";
  const recurrenceLabel = (value?: unknown) =>
    TASK_RECURRENCE_LABELS[value as TaskRecurrence]?.toLowerCase();
  const priorityLabel = (value?: unknown) =>
    TASK_PRIORITY_CONFIG[value as TaskPriority]?.label ?? "—";

  const describe = (type: ActivityType, change: ActivityChange): React.ReactNode => {
    switch (type) {
      case ActivityType.CREATED:
        if (change.from) return "a créé la tâche (prochaine occurrence)";
        return change.to === "assistant"
          ? "a créé la tâche avec l'assistant IA"
          : "a créé la tâche";
      case ActivityType.STATUS:
        return (
          <>
            a déplacé la tâche de <Strong>{columnLabel(change.from)}</Strong> vers{" "}
            <Strong>{columnLabel(change.to)}</Strong>
          </>
        );
      case ActivityType.ASSIGNEE:
        return (
          <>
            a assigné la tâche à <Strong>{memberName(change.to)}</Strong>
          </>
        );
      case ActivityType.PRIORITY:
        return (
          <>
            a changé la priorité de <Strong>{priorityLabel(change.from)}</Strong> à{" "}
            <Strong>{priorityLabel(change.to)}</Strong>
          </>
        );
      case ActivityType.DATES: {
        const [start, due] = (change.to as string[] | undefined) ?? [];
        return (
          <>
            a changé la période en{" "}
            <Strong>
              {formatDay(start)} → {formatDay(due)}
            </Strong>
          </>
        );
      }
      case ActivityType.NAME:
        return (
          <>
            a renommé la tâche en <Strong>« {String(change.to ?? "")} »</Strong>
          </>
        );
      case ActivityType.DESCRIPTION:
        return "a modifié la description";
      case ActivityType.LABELS: {
        const before = (change.from as string[] | undefined) ?? [];
        const after = (change.to as string[] | undefined) ?? [];
        const added = after.filter((id) => !before.includes(id)).map(labelName);
        const removed = before.filter((id) => !after.includes(id)).map(labelName);
        return (
          <>
            {added.length > 0 && (
              <>
                a ajouté <Strong>{added.join(", ")}</Strong>
              </>
            )}
            {added.length > 0 && removed.length > 0 && " et "}
            {removed.length > 0 && (
              <>
                a retiré <Strong>{removed.join(", ")}</Strong>
              </>
            )}
          </>
        );
      }
      case ActivityType.PROJECT:
        return (
          <>
            a déplacé la tâche vers <Strong>{projectName(change.to)}</Strong>
          </>
        );
      case ActivityType.DEPENDENCIES: {
        const before = (change.from as string[] | undefined) ?? [];
        const after = (change.to as string[] | undefined) ?? [];
        const added = after.filter((id) => !before.includes(id)).map(taskName);
        const removed = before.filter((id) => !after.includes(id)).map(taskName);
        return (
          <>
            {added.length > 0 && (
              <>
                a ajouté la dépendance <Strong>{added.join(", ")}</Strong>
              </>
            )}
            {added.length > 0 && removed.length > 0 && " et "}
            {removed.length > 0 && (
              <>
                a retiré la dépendance <Strong>{removed.join(", ")}</Strong>
              </>
            )}
          </>
        );
      }
      case ActivityType.RECURRENCE:
        return change.to ? (
          <>
            a rendu la tâche récurrente : <Strong>{recurrenceLabel(change.to)}</Strong>
          </>
        ) : (
          "a arrêté la répétition"
        );
      case ActivityType.SPRINT:
        return change.to ? (
          <>
            a placé la tâche dans <Strong>{sprintName(change.to)}</Strong>
          </>
        ) : (
          <>
            a retiré la tâche de <Strong>{sprintName(change.from)}</Strong>
          </>
        );
      case ActivityType.ESTIMATE:
        return change.to != null ? (
          <>
            a estimé la tâche à <Strong>{String(change.to)} pts</Strong>
          </>
        ) : (
          "a retiré l'estimation"
        );
      case ActivityType.ATTACHMENT_ADDED:
        return (
          <>
            a joint <Strong>{String(change.to ?? "un fichier")}</Strong>
          </>
        );
      case ActivityType.ATTACHMENT_REMOVED:
        return (
          <>
            a retiré la pièce jointe <Strong>{String(change.from ?? "")}</Strong>
          </>
        );
      case ActivityType.GITHUB_CLOSED:
        return "a fermé l'issue sur GitHub";
      case ActivityType.GITHUB_REOPENED:
        return "a rouvert l'issue sur GitHub";
      case ActivityType.GITHUB_EDITED:
        return "a modifié l'issue sur GitHub";
    }
  };

  const items = [
    ...(activities ?? []).map((activity) => ({ kind: "activity" as const, activity })),
    ...(comments ?? []).map((comment) => ({ kind: "comment" as const, comment })),
  ].sort((a, b) => {
    const dateA = a.kind === "activity" ? a.activity.$createdAt : a.comment.$createdAt;
    const dateB = b.kind === "activity" ? b.activity.$createdAt : b.comment.$createdAt;
    return dateA.localeCompare(dateB);
  });

  const mentionable = memberList.map((member) => ({ id: member.$id, name: member.name }));
  const isLoading = isLoadingComments || isLoadingActivities;

  const handleDelete = async (commentId: string) => {
    if (await confirmDelete()) deleteComment({ param: { commentId } });
  };

  return (
    <Card>
      <DeleteDialog />
      <CardHeader className="flex-row flex-wrap items-center justify-between gap-2 border-b py-3">
        <CardTitle className="text-sm">Activité</CardTitle>
        {assistantReady && commentCount >= 2 && !isSummarizing && (
          <Button size="sm" variant="ghost" onClick={() => setIsSummarizing(true)}>
            <SparklesIcon />
            Résumer la discussion
          </Button>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-4 pt-5">
        {isSummarizing && (
          <DiscussionSummary taskId={task.$id} onClose={() => setIsSummarizing(false)} />
        )}
        {isLoading ? (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : (
          <ol className="flex flex-col gap-4">
            {items.map((item) => {
              if (item.kind === "activity") {
                const { activity } = item;
                const fromGithub = !activity.memberId;
                const change = parseChange(activity.data);
                const actor = fromGithub
                  ? String(change.to ?? "GitHub")
                  : memberName(activity.memberId);

                return (
                  <li
                    key={activity.$id}
                    className="flex items-start gap-2.5 text-[13px] text-muted-foreground"
                  >
                    {fromGithub ? (
                      <FaGithub className="mt-0.5 size-5 shrink-0 text-foreground" />
                    ) : (
                      <MemberAvatar name={actor} className="mt-0.5" />
                    )}
                    <p className="min-w-0">
                      <Strong>{actor}</Strong> {describe(activity.type, fromGithub ? {} : change)} ·{" "}
                      <TimeAgo date={activity.$createdAt} />
                    </p>
                  </li>
                );
              }

              const { comment } = item;
              const githubLogin = comment.memberId.startsWith(GITHUB_AUTHOR_PREFIX)
                ? comment.memberId.slice(GITHUB_AUTHOR_PREFIX.length)
                : null;
              const author = githubLogin ?? memberName(comment.memberId);
              const isAuthor = comment.memberId === currentMember?.$id;
              const canDelete = isAuthor || currentMember?.role === MemberRole.ADMIN;

              return (
                <li key={comment.$id} className="flex items-start gap-2.5">
                  {githubLogin ? (
                    <FaGithub className="mt-2 size-5 shrink-0" />
                  ) : (
                    <MemberAvatar name={author} className="mt-2" />
                  )}
                  <div className="min-w-0 flex-1 rounded-lg border bg-card px-3 py-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">{author}</span>
                      {githubLogin && <span>via GitHub</span>}
                      <TimeAgo date={comment.$createdAt} />
                      {isEdited(comment.$createdAt, comment.$updatedAt) && <span>· modifié</span>}
                      {canDelete && editingId !== comment.$id && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="ml-auto size-6"
                              aria-label="Actions du commentaire"
                            >
                              <MoreHorizontalIcon />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {isAuthor && (
                              <DropdownMenuItem onSelect={() => setEditingId(comment.$id)}>
                                <PencilIcon />
                                Modifier
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              variant="destructive"
                              onSelect={() => handleDelete(comment.$id)}
                            >
                              <Trash2Icon />
                              Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                    <div className="mt-1">
                      {editingId === comment.$id ? (
                        <CommentComposer
                          members={mentionable}
                          initialContent={comment.content}
                          submitLabel="Enregistrer"
                          isPending={isUpdating}
                          autoFocus
                          onCancel={() => setEditingId(null)}
                          onSubmit={(content) =>
                            updateComment(
                              { param: { commentId: comment.$id }, json: { content } },
                              { onSuccess: () => setEditingId(null) },
                            )
                          }
                        />
                      ) : (
                        <CommentContent content={comment.content} />
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
        <CommentComposer
          members={mentionable}
          submitLabel="Commenter"
          isPending={isCreating}
          onSubmit={(content) => createComment({ json: { taskId: task.$id, content } })}
          onSuggest={assistantReady && commentCount > 0 ? () => suggestReply(task.$id) : undefined}
        />
      </CardContent>
    </Card>
  );
};
