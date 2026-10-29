"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addDays, format, isSameDay, startOfDay } from "date-fns";
import { fr } from "date-fns/locale";
import { CheckCircle2Icon, ExternalLinkIcon, LogInIcon, SparklesIcon, XIcon } from "lucide-react";

import { useCurrent } from "@/features/auth/api/use-current";
import { useGetMembers } from "@/features/members/api/use-get-members";
import { useGetLabels } from "@/features/labels/api/use-get-labels";
import { useAssistantReady } from "@/features/assistant/api/use-assistant";
import { useGetProjects } from "@/features/projects/api/use-get-projects";
import { ProjectAvatar } from "@/features/projects/components/project-avatar";
import { useWorkspaceColumns } from "@/features/projects/hooks/use-workspace-columns";
import { Workspace } from "@/features/workspaces/types";
import { useGetWorkspaces } from "@/features/workspaces/api/use-get-workspaces";
import { WorkspaceAvatar } from "@/features/workspaces/components/workspace-avatar";
import { TASK_PRIORITY_CONFIG } from "@/features/tasks/constants";
import { TaskPriority, TaskStatus } from "@/features/tasks/types";

import { cn } from "@/lib/utils";
import { client } from "@/lib/rpc";
import { Kbd } from "@/components/ui/kbd";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { DatePicker } from "@/components/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { isDesktopApp } from "../tauri";

const STORAGE_KEY = "boardify:quick-add";
const OPEN_EVENT = "boardify:quick-add";
const CLOSE_DELAY_MS = 1500;

interface Preferences {
  workspaceId?: string;
  projectIds?: Record<string, string>;
}

const readPreferences = (): Preferences => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") as Preferences;
  } catch {
    return {};
  }
};

const savePreferences = (workspaceId: string, projectId: string) => {
  try {
    const preferences = readPreferences();
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        workspaceId,
        projectIds: { ...preferences.projectIds, [workspaceId]: projectId },
      }),
    );
  } catch {
    // Préférences facultatives : on ignore un stockage indisponible.
  }
};

// Dans l'application desktop, ces adresses sont interceptées par Tauri pour fermer la fenêtre
// d'ajout rapide ou ouvrir une page dans la fenêtre principale.
const navigateTo = (path: string) =>
  // Navigation réelle (et non côté client) pour que Tauri puisse l'intercepter.
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination
  window.location.assign(`${window.location.origin}${path}`);

const closeWindow = () => {
  if (isDesktopApp()) navigateTo("/quick-add/close");
};

const useOpenInApp = () => {
  const router = useRouter();
  return (path: string) => {
    if (isDesktopApp()) {
      navigateTo(`/quick-add/open?to=${encodeURIComponent(path)}`);
    } else {
      router.push(path);
    }
  };
};

const DUE_PRESETS = [
  { label: "Aujourd'hui", days: 0 },
  { label: "Demain", days: 1 },
  { label: "Dans 1 semaine", days: 7 },
];

interface QuickAddFormProps {
  workspaceId: string;
  workspaces: Workspace[];
  userId: string;
  onWorkspaceChange: (workspaceId: string) => void;
}

const QuickAddForm = ({
  workspaceId,
  workspaces,
  userId,
  onWorkspaceChange,
}: QuickAddFormProps) => {
  const openInApp = useOpenInApp();
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: projects, isLoading: isLoadingProjects } = useGetProjects({ workspaceId });
  const { data: members } = useGetMembers({ workspaceId });
  const columns = useWorkspaceColumns(workspaceId);

  const [name, setName] = useState("");
  const [projectId, setProjectId] = useState<string | null>(
    () => readPreferences().projectIds?.[workspaceId] ?? null,
  );
  const [dueDate, setDueDate] = useState(() => startOfDay(new Date()));
  const [priority, setPriority] = useState(TaskPriority.MEDIUM);
  const [created, setCreated] = useState<{ $id: string; name: string } | null>(null);
  const [assigneeId, setAssigneeId] = useState<string | null>(null);
  const [labelIds, setLabelIds] = useState<string[]>([]);
  const assistantReady = useAssistantReady(workspaceId);
  const { data: labels } = useGetLabels({ workspaceId });

  const projectList = projects?.documents ?? [];
  const project = projectList.find((candidate) => candidate.$id === projectId) ?? projectList[0];
  const memberId = members?.documents.find((member) => member.userId === userId)?.$id;
  const projectColumns = columns.find((entry) => entry.projectId === project?.$id)?.columns ?? [];
  const status =
    projectColumns.find((column) => column.id === TaskStatus.TODO && !column.done) ??
    projectColumns.find((column) => !column.done) ??
    projectColumns[0];

  const { mutate, isPending, error } = useMutation({
    mutationFn: async () => {
      if (!project || !memberId || !status) throw new Error("Formulaire incomplet");

      const today = startOfDay(new Date());
      const response = await client.api.tasks.$post({
        json: {
          name: name.trim(),
          workspaceId,
          projectId: project.$id,
          assigneeId: assigneeId ?? memberId,
          labelIds,
          status: status.id,
          priority,
          startDate: dueDate < today ? dueDate : today,
          dueDate,
        },
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: unknown } | null;
        throw new Error(
          (response.status === 400 && typeof body?.error === "string" && body.error) ||
            "Impossible de créer la tâche",
        );
      }

      const { data } = await response.json();
      return data;
    },
    onSuccess: (task) => {
      savePreferences(workspaceId, task.projectId);
      setCreated({ $id: task.$id, name: task.name });
      setName("");
    },
  });

  useEffect(() => {
    if (!created) return;
    const timeout = setTimeout(closeWindow, CLOSE_DELAY_MS);
    return () => clearTimeout(timeout);
  }, [created]);

  const canSubmit = Boolean(name.trim() && project && memberId && status) && !isPending;

  // Ajout rapide intelligent : « Appeler Marie vendredi, urgent #commercial » → champs.
  const { mutate: interpret, isPending: isInterpreting } = useMutation({
    mutationFn: async () => {
      const response = await client.api.assistant.workspaces[":workspaceId"].parse.$post({
        param: { workspaceId },
        json: { text: name.trim() },
      });
      const body = (await response.json().catch(() => null)) as {
        data?: {
          name: string;
          dueDate: string | null;
          priority: TaskPriority | null;
          projectId: string | null;
          assigneeId: string | null;
          labelIds: string[];
        };
        error?: string;
      } | null;
      if (!response.ok || !body?.data) throw new Error(body?.error ?? "Interprétation impossible");
      return body.data;
    },
    onSuccess: (parsed) => {
      setName(parsed.name);
      if (parsed.dueDate) {
        const [year, month, day] = parsed.dueDate.split("-").map(Number);
        setDueDate(new Date(year, month - 1, day));
      }
      if (parsed.priority) setPriority(parsed.priority);
      if (parsed.projectId) setProjectId(parsed.projectId);
      setAssigneeId(parsed.assigneeId && parsed.assigneeId !== memberId ? parsed.assigneeId : null);
      setLabelIds(parsed.labelIds);
      inputRef.current?.focus();
    },
  });
  const canInterpret = assistantReady && name.trim().length >= 3 && !isInterpreting;
  const assigneeName = members?.documents.find((member) => member.$id === assigneeId)?.name;

  if (created) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
        <CheckCircle2Icon className="size-9 text-primary" />
        <div>
          <p className="font-medium">Tâche créée</p>
          <p className="max-w-sm truncate text-sm text-muted-foreground">{created.name}</p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => openInApp(`/workspaces/${workspaceId}/tasks/${created.$id}`)}
          >
            <ExternalLinkIcon />
            Ouvrir
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setCreated(null);
              requestAnimationFrame(() => inputRef.current?.focus());
            }}
          >
            Nouvelle tâche
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form
      className="flex flex-1 flex-col gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        if (canSubmit) mutate();
      }}
    >
      <div className="flex items-center gap-2">
        <Input
          ref={inputRef}
          autoFocus
          value={name}
          maxLength={256}
          onChange={(event) => setName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "i" && (event.metaKey || event.ctrlKey) && canInterpret) {
              event.preventDefault();
              interpret();
            }
          }}
          placeholder={
            assistantReady
              ? "Ex. : Appeler le client vendredi, urgent #commercial"
              : "Que faut-il faire ?"
          }
          aria-label="Nom de la tâche"
          className="h-12 border-0 bg-transparent px-1 text-lg shadow-none focus-visible:ring-0 md:text-lg"
        />
        {assistantReady && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={!canInterpret}
            onClick={() => interpret()}
            title="Remplir les champs à partir de la phrase (⌘I)"
          >
            {isInterpreting ? <Spinner className="text-current" /> : <SparklesIcon />}
            Interpréter
          </Button>
        )}
      </div>

      {(assigneeName || labelIds.length > 0) && (
        <div className="flex flex-wrap gap-1.5">
          {assigneeName && (
            <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs">
              Assignée à {assigneeName}
              <button type="button" onClick={() => setAssigneeId(null)} aria-label="Me l'assigner">
                <XIcon className="size-3" />
              </button>
            </span>
          )}
          {labelIds.map((labelId) => (
            <span
              key={labelId}
              className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs"
            >
              #{labels?.documents.find((label) => label.$id === labelId)?.name ?? "étiquette"}
              <button
                type="button"
                onClick={() => setLabelIds((current) => current.filter((id) => id !== labelId))}
                aria-label="Retirer l'étiquette"
              >
                <XIcon className="size-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        {workspaces.length > 1 && (
          <Select value={workspaceId} onValueChange={onWorkspaceChange}>
            <SelectTrigger className="w-full" aria-label="Espace de travail">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {workspaces.map((workspace) => (
                <SelectItem key={workspace.$id} value={workspace.$id}>
                  <WorkspaceAvatar
                    name={workspace.name}
                    image={workspace.imageUrl}
                    className="size-5"
                  />
                  <span className="truncate">{workspace.name}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Select
          value={project?.$id ?? ""}
          onValueChange={setProjectId}
          disabled={isLoadingProjects || projectList.length === 0}
        >
          <SelectTrigger
            className={cn("w-full", workspaces.length <= 1 && "col-span-1")}
            aria-label="Projet"
          >
            <SelectValue placeholder={isLoadingProjects ? "Chargement…" : "Aucun projet"} />
          </SelectTrigger>
          <SelectContent>
            {projectList.map((candidate) => (
              <SelectItem key={candidate.$id} value={candidate.$id}>
                <ProjectAvatar name={candidate.name} image={candidate.imageUrl} />
                <span className="truncate">{candidate.name}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={priority} onValueChange={(value) => setPriority(value as TaskPriority)}>
          <SelectTrigger className="w-full" aria-label="Priorité">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.values(TaskPriority).map((value) => (
              <SelectItem key={value} value={value}>
                <span className={cn("size-2 rounded-full", TASK_PRIORITY_CONFIG[value].dot)} />
                Priorité {TASK_PRIORITY_CONFIG[value].label.toLowerCase()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-xs text-muted-foreground">Échéance</span>
        {DUE_PRESETS.map((preset) => {
          const date = addDays(startOfDay(new Date()), preset.days);
          const active = isSameDay(date, dueDate);
          return (
            <Button
              key={preset.label}
              type="button"
              size="xs"
              variant={active ? "secondary" : "ghost"}
              aria-pressed={active}
              onClick={() => setDueDate(date)}
            >
              {preset.label}
            </Button>
          );
        })}
        <DatePicker
          value={dueDate}
          onChange={(date) => setDueDate(startOfDay(date))}
          className="h-7 w-auto px-2 text-xs"
        />
      </div>

      {error && <p className="text-sm text-destructive">{error.message}</p>}
      {!isLoadingProjects && projectList.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Créez d&apos;abord un projet dans cet espace de travail.
        </p>
      )}

      <div className="mt-auto flex items-center justify-between gap-3 border-t pt-3">
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Kbd>↵</Kbd> créer
          <span className="mx-1">·</span>
          <Kbd>Échap</Kbd> fermer
          {assistantReady && (
            <>
              <span className="mx-1">·</span>
              <Kbd>⌘I</Kbd> interpréter
            </>
          )}
          <span className="mx-1 hidden sm:inline">·</span>
          <span className="hidden sm:inline">
            échéance {format(dueDate, "EEEE d MMMM", { locale: fr })}
          </span>
        </p>
        <Button type="submit" size="sm" disabled={!canSubmit}>
          {isPending && <Spinner className="text-current" />}
          Créer la tâche
        </Button>
      </div>
    </form>
  );
};

export const QuickAdd = () => {
  const queryClient = useQueryClient();
  const openInApp = useOpenInApp();
  const [openCount, setOpenCount] = useState(0);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);

  const { data: user, isLoading: isLoadingUser } = useCurrent();
  const { data: workspaces, isLoading: isLoadingWorkspaces } = useGetWorkspaces();

  const workspaceList = (workspaces?.documents ?? []) as Workspace[];
  const preferred = workspaceId ?? readPreferences().workspaceId;
  const workspace =
    workspaceList.find((candidate) => candidate.$id === preferred) ?? workspaceList[0];

  useEffect(() => {
    const onOpen = () => {
      queryClient.invalidateQueries();
      setOpenCount((count) => count + 1);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      const popupOpen = document.querySelector("[data-radix-popper-content-wrapper]");
      if (event.key === "Escape" && !popupOpen) closeWindow();
    };

    window.addEventListener(OPEN_EVENT, onOpen);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener(OPEN_EVENT, onOpen);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [queryClient]);

  if (isLoadingUser || isLoadingWorkspaces) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Spinner className="text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
        <p className="text-sm text-muted-foreground">
          Connectez-vous à Boardify pour ajouter des tâches.
        </p>
        <Button size="sm" onClick={() => openInApp("/sign-in")}>
          <LogInIcon />
          Se connecter
        </Button>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
        <p className="text-sm text-muted-foreground">Aucun espace de travail pour le moment.</p>
        <Button size="sm" onClick={() => openInApp("/workspaces/create")}>
          Créer un espace de travail
        </Button>
      </div>
    );
  }

  return (
    // Le formulaire repart de zéro à chaque ouverture de la fenêtre.
    <QuickAddForm
      key={`${workspace.$id}-${openCount}`}
      workspaceId={workspace.$id}
      workspaces={workspaceList}
      userId={user.$id}
      onWorkspaceChange={setWorkspaceId}
    />
  );
};
