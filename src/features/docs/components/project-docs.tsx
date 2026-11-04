"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useQueryState } from "nuqs";
import {
  ArrowLeftIcon,
  FileTextIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  Trash2Icon,
} from "lucide-react";

import { useCurrent } from "@/features/auth/api/use-current";
import { MemberRole } from "@/features/members/types";
import { useGetMembers } from "@/features/members/api/use-get-members";
import { MemberAvatar } from "@/features/members/components/member-avatar";
import { useGetProject } from "@/features/projects/api/use-get-project";
import { useProjectId } from "@/features/projects/hooks/use-project-id";

import { cn } from "@/lib/utils";
import { useConfirm } from "@/hooks/use-confirm";
import { Markdown } from "@/components/markdown";
import { TimeAgo } from "@/components/time-ago";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Skeleton } from "@/components/ui/skeleton";
import { PageError } from "@/components/page-error";
import { PageLoader } from "@/components/page-loader";
import { MarkdownEditor } from "@/components/markdown-editor";

import { DOC_TITLE_MAX, filterDocsByTitle } from "../schemas";
import { DocTaskPicker } from "./doc-task-picker";
import { useCreateDoc, useDeleteDoc, useGetDoc, useGetDocs, useUpdateDoc } from "../api/use-docs";

type Members = Map<string, { name: string; avatarUrl?: string }>;

/** Documentation d'un projet : liste des pages à gauche, page ouverte à droite (l'une ou l'autre sur mobile). */
export const ProjectDocs = () => {
  const projectId = useProjectId();
  const [docId, setDocId] = useQueryState("doc");
  const [editing, setEditing] = useState(false);
  const [search, setSearch] = useState("");

  const { data: project, isLoading: isLoadingProject } = useGetProject({ projectId });
  const { data: docs, isLoading: isLoadingDocs } = useGetDocs({ projectId });
  const { data: members } = useGetMembers({
    workspaceId: project?.workspaceId ?? "",
    enabled: Boolean(project),
  });
  const createDoc = useCreateDoc();

  const memberMap: Members = new Map(
    (members?.documents ?? []).map((member) => [
      member.$id,
      { name: member.name, avatarUrl: member.avatarUrl },
    ]),
  );

  // Page supprimée (par soi ou un autre membre) : retour à la liste.
  useEffect(() => {
    if (docId && docs?.enabled && !docs.documents.some((doc) => doc.$id === docId)) {
      setDocId(null);
    }
  }, [docId, docs, setDocId]);

  if (isLoadingProject || isLoadingDocs) return <PageLoader />;
  if (!project) {
    return (
      <PageError
        message="Projet introuvable"
        description="Ce projet n'existe pas ou vous n'y avez pas accès."
      />
    );
  }
  if (!docs?.enabled) {
    return (
      <PageError
        message="Documentation indisponible"
        description="La documentation n'est pas activée sur cet espace."
      />
    );
  }

  const projectHref = `/workspaces/${project.workspaceId}/projects/${project.$id}`;
  const pages = filterDocsByTitle(docs.documents, search);

  const handleCreate = () =>
    createDoc.mutate(
      { json: { projectId, title: "Nouvelle page", content: "" } },
      {
        onSuccess: (doc) => {
          setDocId(doc.$id);
          setEditing(true);
        },
      },
    );

  const open = (id: string | null) => {
    setDocId(id);
    setEditing(false);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <Button variant="ghost" size="xs" asChild className="-ml-2 text-muted-foreground">
            <Link href={projectHref}>
              <ArrowLeftIcon />
              {project.name}
            </Link>
          </Button>
          <h1 className="mt-1 text-xl font-semibold tracking-tight">Documentation</h1>
        </div>
        <Button size="sm" onClick={handleCreate} disabled={createDoc.isPending}>
          {createDoc.isPending ? <Spinner className="text-primary-foreground" /> : <PlusIcon />}
          Nouvelle page
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,280px)_minmax(0,1fr)]">
        <aside className={cn("flex min-w-0 flex-col gap-3", docId && "hidden lg:flex")}>
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Rechercher une page…"
              aria-label="Rechercher une page"
              className="pl-8"
            />
          </div>
          {pages.length === 0 ? (
            <div className="rounded-lg border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
              {docs.documents.length === 0
                ? "Aucune page pour l'instant. Rédigez les specs, notes de réunion ou décisions du projet."
                : "Aucune page ne correspond à cette recherche."}
            </div>
          ) : (
            <ul className="flex flex-col gap-1">
              {pages.map((doc) => (
                <li key={doc.$id}>
                  <button
                    type="button"
                    onClick={() => open(doc.$id)}
                    className={cn(
                      "flex w-full items-start gap-2.5 rounded-lg px-3 py-2 text-left transition-colors hover:bg-muted",
                      doc.$id === docId && "bg-muted",
                    )}
                  >
                    <FileTextIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">{doc.title}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {memberMap.get(doc.updatedBy)?.name ?? "Un membre"} ·{" "}
                        <TimeAgo date={doc.$updatedAt} />
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        <section className={cn("min-w-0", !docId && "hidden lg:block")}>
          {docId ? (
            <DocPage
              key={docId}
              docId={docId}
              members={memberMap}
              editing={editing}
              onEdit={setEditing}
              onBack={() => open(null)}
            />
          ) : (
            <div className="flex min-h-64 flex-col items-center justify-center rounded-lg border border-dashed px-4 text-center text-sm text-muted-foreground">
              <FileTextIcon className="mb-2 size-6" />
              Choisissez une page ou créez-en une.
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

interface DocPageProps {
  docId: string;
  members: Members;
  editing: boolean;
  onEdit: (editing: boolean) => void;
  onBack: () => void;
}

const DocPage = ({ docId, members, editing, onEdit, onBack }: DocPageProps) => {
  const { data: doc, isLoading, isError } = useGetDoc({ docId });
  const { data: current } = useCurrent();
  const { data: memberList } = useGetMembers({
    workspaceId: doc?.workspaceId ?? "",
    enabled: Boolean(doc),
  });
  const deleteDoc = useDeleteDoc();
  const [DeleteDialog, confirmDelete] = useConfirm(
    "Supprimer la page",
    "Cette page sera définitivement supprimée.",
    "destructive",
  );

  const back = (
    <Button
      variant="ghost"
      size="xs"
      onClick={onBack}
      className="-ml-2 self-start text-muted-foreground lg:hidden"
    >
      <ArrowLeftIcon />
      Toutes les pages
    </Button>
  );

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-7 w-1/2" />
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }
  if (isError || !doc) {
    return (
      <div className="flex flex-col gap-2">
        {back}
        <p className="text-sm text-muted-foreground">Cette page n&apos;existe plus.</p>
      </div>
    );
  }

  const currentMember = memberList?.documents.find((member) => member.userId === current?.$id);
  const canDelete =
    doc.createdBy === currentMember?.$id || currentMember?.role === MemberRole.ADMIN;
  const author = members.get(doc.createdBy);
  const editor = members.get(doc.updatedBy);

  if (editing) {
    return (
      <div className="flex flex-col gap-2">
        {back}
        <DocEditor doc={doc} onDone={() => onEdit(false)} />
      </div>
    );
  }

  const handleDelete = async () => {
    if (!(await confirmDelete())) return;
    deleteDoc.mutate(doc.$id, { onSuccess: onBack });
  };

  return (
    <article className="flex min-w-0 flex-col gap-4">
      <DeleteDialog />
      {back}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h2 className="min-w-0 text-2xl font-semibold tracking-tight break-words">{doc.title}</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => onEdit(true)}>
            <PencilIcon />
            Modifier
          </Button>
          {canDelete && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleDelete}
              disabled={deleteDoc.isPending}
              aria-label="Supprimer la page"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2Icon />
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <MemberAvatar name={author?.name} image={author?.avatarUrl} className="size-4" />
          Créée par {author?.name ?? "un membre"} <TimeAgo date={doc.$createdAt} />
        </span>
        {doc.$updatedAt !== doc.$createdAt && (
          <span className="flex items-center gap-1.5">
            <MemberAvatar name={editor?.name} image={editor?.avatarUrl} className="size-4" />
            Modifiée par {editor?.name ?? "un membre"} <TimeAgo date={doc.$updatedAt} />
          </span>
        )}
      </div>

      {doc.tasks.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">Tâches liées :</span>
          {doc.tasks.map((task) => (
            <Link
              key={task.$id}
              href={`/workspaces/${doc.workspaceId}/tasks/${task.$id}`}
              className="max-w-full truncate rounded-md border bg-muted/50 px-2 py-0.5 text-xs font-medium hover:border-primary/40 hover:text-primary"
            >
              {task.name}
            </Link>
          ))}
        </div>
      )}

      <div className="rounded-lg border bg-background p-4 sm:p-6">
        {doc.content.trim() ? (
          <Markdown>{doc.content}</Markdown>
        ) : (
          <p className="text-sm text-muted-foreground">
            Page vide.{" "}
            <button
              type="button"
              onClick={() => onEdit(true)}
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Commencer la rédaction
            </button>
          </p>
        )}
      </div>
    </article>
  );
};

interface DocEditorProps {
  doc: {
    $id: string;
    workspaceId: string;
    projectId: string;
    title: string;
    content: string;
    tasks: { $id: string }[];
  };
  onDone: () => void;
}

const DocEditor = ({ doc, onDone }: DocEditorProps) => {
  const [title, setTitle] = useState(doc.title);
  const [content, setContent] = useState(doc.content);
  const [taskIds, setTaskIds] = useState(doc.tasks.map((task) => task.$id));
  const updateDoc = useUpdateDoc();

  const handleSave = (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim()) return;
    updateDoc.mutate(
      { param: { docId: doc.$id }, json: { title: title.trim(), content, taskIds } },
      { onSuccess: onDone },
    );
  };

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-4">
      <Input
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        maxLength={DOC_TITLE_MAX}
        placeholder="Titre de la page"
        aria-label="Titre de la page"
        className="h-11 text-lg font-semibold"
        autoFocus
      />
      <DocTaskPicker
        workspaceId={doc.workspaceId}
        projectId={doc.projectId}
        value={taskIds}
        onChange={setTaskIds}
        disabled={updateDoc.isPending}
      />
      <MarkdownEditor
        value={content}
        onChange={setContent}
        placeholder="Specs, notes de réunion, décisions… (Markdown)"
        className="min-h-80"
        disabled={updateDoc.isPending}
      />
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="ghost" onClick={onDone} disabled={updateDoc.isPending}>
          Annuler
        </Button>
        <Button type="submit" disabled={updateDoc.isPending || !title.trim()}>
          {updateDoc.isPending && <Spinner className="text-primary-foreground" />}
          Enregistrer
        </Button>
      </div>
    </form>
  );
};
