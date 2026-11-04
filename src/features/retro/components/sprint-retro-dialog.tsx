"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowUpRightIcon,
  ListTodoIcon,
  PencilIcon,
  PlusIcon,
  ThumbsUpIcon,
  Trash2Icon,
  WrenchIcon,
  type LucideIcon,
} from "lucide-react";

import { useCurrent } from "@/features/auth/api/use-current";
import { useGetMembers } from "@/features/members/api/use-get-members";
import { MemberAvatar } from "@/features/members/components/member-avatar";
import type { Sprint } from "@/features/sprints/types";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { useConfirm } from "@/hooks/use-confirm";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { RETRO_KINDS, type RetroItem, type RetroKind } from "../types";
import {
  useCreateRetroItem,
  useCreateRetroTask,
  useDeleteRetroItem,
  useRetro,
  useUpdateRetroItem,
} from "../api/use-retro";

const KIND_CONFIG: Record<
  RetroKind,
  { label: string; placeholder: string; icon: LucideIcon; accent: string }
> = {
  good: {
    label: "Ce qui a bien marché",
    placeholder: "Une réussite, une bonne pratique à garder…",
    icon: ThumbsUpIcon,
    accent: "text-green-600 dark:text-green-400",
  },
  improve: {
    label: "À améliorer",
    placeholder: "Un frein, une difficulté…",
    icon: WrenchIcon,
    accent: "text-amber-600 dark:text-amber-400",
  },
  action: {
    label: "Actions",
    placeholder: "Ce que l'équipe fera différemment…",
    icon: ListTodoIcon,
    accent: "text-primary",
  },
};

const MAX_LENGTH = 1000;

interface Author {
  name: string;
  image?: string;
}

interface ItemCardProps {
  item: RetroItem;
  author: Author;
  isMine: boolean;
  workspaceId: string;
}

const ItemCard = ({ item, author, isMine, workspaceId }: ItemCardProps) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(item.content);
  const update = useUpdateRetroItem();
  const remove = useDeleteRetroItem();
  const createTask = useCreateRetroTask();
  const [ConfirmDialog, confirm] = useConfirm(
    "Supprimer cet élément",
    item.taskId ? "La tâche créée depuis cette action est conservée." : "",
    "destructive",
  );

  const save = () => {
    const content = draft.trim();
    if (!content || content === item.content) return setEditing(false);
    update.mutate(
      { param: { itemId: item.$id }, json: { content } },
      { onSuccess: () => setEditing(false) },
    );
  };

  return (
    <li className="flex flex-col gap-2 rounded-md border bg-background p-3 text-sm">
      <ConfirmDialog />
      {editing ? (
        <div className="flex flex-col gap-2">
          <Textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            maxLength={MAX_LENGTH}
            rows={3}
            autoFocus
            aria-label="Modifier l'élément"
            onKeyDown={(event) => {
              if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) save();
              if (event.key === "Escape") setEditing(false);
            }}
          />
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
              Annuler
            </Button>
            <Button size="sm" onClick={save} disabled={update.isPending}>
              Enregistrer
            </Button>
          </div>
        </div>
      ) : (
        <p className="break-words whitespace-pre-wrap">{item.content}</p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <span className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
          <MemberAvatar
            name={author.name}
            image={author.image}
            className="size-4"
            fallbackClassName="text-[8px]"
          />
          <span className="truncate">{author.name}</span>
        </span>
        <div className="ml-auto flex items-center gap-1">
          {item.kind === "action" &&
            (item.taskId ? (
              <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" asChild>
                <Link href={`/workspaces/${workspaceId}/tasks/${item.taskId}`}>
                  Voir la tâche
                  <ArrowUpRightIcon />
                </Link>
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="h-7 px-2 text-xs"
                disabled={createTask.isPending}
                onClick={() => createTask.mutate({ param: { itemId: item.$id }, json: {} })}
              >
                {createTask.isPending ? <Spinner /> : <PlusIcon />}
                Créer une tâche
              </Button>
            ))}
          {isMine && !editing && (
            <>
              <Button
                size="icon-sm"
                variant="ghost"
                aria-label="Modifier"
                className="text-muted-foreground"
                onClick={() => {
                  setDraft(item.content);
                  setEditing(true);
                }}
              >
                <PencilIcon />
              </Button>
              <Button
                size="icon-sm"
                variant="ghost"
                aria-label="Supprimer"
                className="text-muted-foreground hover:text-destructive"
                disabled={remove.isPending}
                onClick={async () => {
                  if (await confirm()) remove.mutate(item.$id);
                }}
              >
                <Trash2Icon />
              </Button>
            </>
          )}
        </div>
      </div>
    </li>
  );
};

const AddItem = ({ sprintId, kind }: { sprintId: string; kind: RetroKind }) => {
  const [content, setContent] = useState("");
  const { mutate, isPending } = useCreateRetroItem();

  const submit = () => {
    const value = content.trim();
    if (!value) return;
    mutate({ json: { sprintId, kind, content: value } }, { onSuccess: () => setContent("") });
  };

  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <Textarea
        value={content}
        onChange={(event) => setContent(event.target.value)}
        placeholder={KIND_CONFIG[kind].placeholder}
        maxLength={MAX_LENGTH}
        rows={2}
        aria-label={`Ajouter dans « ${KIND_CONFIG[kind].label} »`}
        onKeyDown={(event) => {
          if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) submit();
        }}
      />
      <Button type="submit" size="sm" variant="outline" disabled={isPending || !content.trim()}>
        <PlusIcon />
        Ajouter
      </Button>
    </form>
  );
};

interface SprintRetroDialogProps {
  sprint: Sprint;
  onClose: () => void;
}

/** Rétrospective d'un sprint : ce qui a marché, ce qui est à améliorer, et les actions. */
export const SprintRetroDialog = ({ sprint, onClose }: SprintRetroDialogProps) => {
  const { data, isLoading } = useRetro(sprint.$id);
  const { data: members } = useGetMembers({ workspaceId: sprint.workspaceId });
  const { data: user } = useCurrent();

  const authors = new Map<string, Author & { userId: string }>(
    (members?.documents ?? []).map((member) => [
      member.$id,
      {
        name: member.name || member.email || "Membre",
        image: member.avatarUrl,
        userId: member.userId,
      },
    ]),
  );
  const items = (data?.items ?? []) as RetroItem[];

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex max-h-[90vh] flex-col gap-4 overflow-hidden p-4 sm:max-w-5xl sm:p-6">
        <DialogHeader>
          <DialogTitle>Rétrospective · {sprint.name}</DialogTitle>
          <DialogDescription>
            Chacun ajoute ses retours ; une action peut devenir une tâche du projet.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : (
          <div className="-mx-1 grid min-h-0 grid-cols-1 gap-4 overflow-y-auto px-1 md:grid-cols-3">
            {RETRO_KINDS.map((kind) => {
              const config = KIND_CONFIG[kind];
              const entries = items.filter((item) => item.kind === kind);
              return (
                <section
                  key={kind}
                  aria-label={config.label}
                  className="flex min-w-0 flex-col gap-3 rounded-lg border bg-muted/40 p-3"
                >
                  <h3 className="flex items-center gap-2 text-sm font-medium">
                    <config.icon className={cn("size-4", config.accent)} />
                    {config.label}
                    <span className="ml-auto text-xs font-normal text-muted-foreground tabular-nums">
                      {entries.length}
                    </span>
                  </h3>
                  {entries.length > 0 && (
                    <ul className="flex flex-col gap-2">
                      {entries.map((item) => {
                        const author = authors.get(item.memberId);
                        return (
                          <ItemCard
                            key={item.$id}
                            item={item}
                            author={author ?? { name: "Ancien membre" }}
                            isMine={Boolean(user && author?.userId === user.$id)}
                            workspaceId={sprint.workspaceId}
                          />
                        );
                      })}
                    </ul>
                  )}
                  <AddItem sprintId={sprint.$id} kind={kind} />
                </section>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
