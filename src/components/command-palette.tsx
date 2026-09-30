"use client";

import { useEffect, useSyncExternalStore } from "react";
import { Command } from "cmdk";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import {
  FolderIcon,
  FolderPlusIcon,
  HomeIcon,
  LayoutGridIcon,
  ListChecksIcon,
  LogOutIcon,
  MoonIcon,
  PlusIcon,
  SearchIcon,
  SettingsIcon,
  SunIcon,
  UsersIcon,
} from "lucide-react";

import { useLogout } from "@/features/auth/api/use-logout";
import { useGetProjects } from "@/features/projects/api/use-get-projects";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import { useGetWorkspaces } from "@/features/workspaces/api/use-get-workspaces";
import { useCreateTaskModal } from "@/features/tasks/hooks/use-create-task-modal";
import { useCreateProjectModal } from "@/features/projects/hooks/use-create-project-modal";
import { useCreateWorkspaceModal } from "@/features/workspaces/hooks/use-create-workspace-modal";

import { useHotkeys } from "@/hooks/use-hotkeys";
import { Kbd } from "@/components/ui/kbd";
import { AppVersion } from "@/components/app-version";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

import { useShortcutsHelp } from "./shortcuts-help";

let isOpen = false;
let mounted = 0;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());
const setOpen = (value: boolean) => {
  isOpen = value;
  notify();
};
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const useCommandPalette = () => {
  const open = useSyncExternalStore(
    subscribe,
    () => isOpen,
    () => false,
  );
  const available = useSyncExternalStore(
    subscribe,
    () => mounted > 0,
    () => false,
  );

  return {
    isOpen: open,
    available,
    open: () => setOpen(true),
    close: () => setOpen(false),
    toggle: () => setOpen(!isOpen),
    setOpen,
  };
};

export const GlobalHotkeys = () => {
  const router = useRouter();
  const workspaceId = useWorkspaceId();
  const palette = useCommandPalette();
  const help = useShortcutsHelp();
  const { open: createTask } = useCreateTaskModal();
  const { open: createProject } = useCreateProjectModal();

  const go = (path: string) => {
    if (workspaceId) router.push(`/workspaces/${workspaceId}${path}`);
  };

  useHotkeys({
    "mod+k": () => palette.toggle(),
    n: () => workspaceId && createTask(),
    p: () => workspaceId && createProject(),
    "?": () => help.toggle(),
    "g h": () => go(""),
    "g t": () => go("/tasks"),
    "g s": () => go("/settings"),
    "g m": () => go("/members"),
  });

  return null;
};

const groupClasses =
  "p-1.5 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground";

interface ItemProps {
  value: string;
  keywords?: string[];
  icon?: React.ReactNode;
  shortcut?: string;
  onSelect: () => void;
  children: React.ReactNode;
}

const Item = ({ value, keywords, icon, shortcut, onSelect, children }: ItemProps) => (
  <Command.Item
    value={value}
    keywords={keywords}
    onSelect={onSelect}
    className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-2 text-sm select-none data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-muted-foreground"
  >
    {icon}
    <span className="min-w-0 flex-1 truncate">{children}</span>
    {shortcut && <Kbd>{shortcut}</Kbd>}
  </Command.Item>
);

export const CommandPalette = () => {
  const router = useRouter();
  const workspaceId = useWorkspaceId();
  const { isOpen: open, setOpen: onOpenChange, close } = useCommandPalette();
  useEffect(() => {
    mounted++;
    notify();
    return () => {
      mounted--;
      notify();
    };
  }, []);
  const { resolvedTheme, setTheme } = useTheme();
  const { mutate: logout } = useLogout();
  const { open: createTask } = useCreateTaskModal();
  const { open: createProject } = useCreateProjectModal();
  const { open: createWorkspace } = useCreateWorkspaceModal();
  const { data: workspaces } = useGetWorkspaces();
  const { data: projects } = useGetProjects({ workspaceId });

  const run = (action: () => void) => () => {
    close();
    action();
  };

  const go = (path: string) => run(() => router.push(path));
  const base = `/workspaces/${workspaceId}`;
  const isDark = resolvedTheme === "dark";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        aria-describedby={undefined}
        showCloseButton={false}
        className="top-[20%] max-w-lg translate-y-0 gap-0 overflow-hidden p-0"
      >
        <DialogTitle className="sr-only">Rechercher</DialogTitle>
        <Command loop className="flex flex-col">
          <div className="flex items-center gap-2 border-b px-3">
            <SearchIcon className="size-4 shrink-0 text-muted-foreground" />
            <Command.Input
              autoFocus
              placeholder="Rechercher une page, un projet, une action…"
              className="h-11 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <Command.List className="max-h-[min(60vh,400px)] overflow-y-auto">
            <Command.Empty className="py-8 text-center text-sm text-muted-foreground">
              Aucun résultat.
            </Command.Empty>

            <Command.Group heading="Navigation" className={groupClasses}>
              <Item
                value="accueil"
                keywords={["home", "dashboard"]}
                icon={<HomeIcon />}
                onSelect={go(base)}
              >
                Accueil
              </Item>
              <Item
                value="mes taches"
                keywords={["tâches", "tasks"]}
                icon={<ListChecksIcon />}
                onSelect={go(`${base}/tasks`)}
              >
                Mes tâches
              </Item>
              <Item
                value="parametres"
                keywords={["paramètres", "settings", "réglages"]}
                icon={<SettingsIcon />}
                onSelect={go(`${base}/settings`)}
              >
                Paramètres
              </Item>
              <Item
                value="membres"
                keywords={["équipe", "members", "inviter"]}
                icon={<UsersIcon />}
                onSelect={go(`${base}/members`)}
              >
                Membres
              </Item>
            </Command.Group>

            {!!projects?.documents.length && (
              <Command.Group heading="Projets" className={groupClasses}>
                {projects.documents.map((project) => (
                  <Item
                    key={project.$id}
                    value={`projet ${project.name} ${project.$id}`}
                    icon={<FolderIcon />}
                    onSelect={go(`${base}/projects/${project.$id}`)}
                  >
                    {project.name}
                  </Item>
                ))}
              </Command.Group>
            )}

            <Command.Group heading="Actions" className={groupClasses}>
              <Item
                value="nouvelle tache"
                keywords={["créer", "task"]}
                icon={<PlusIcon />}
                shortcut="N"
                onSelect={run(createTask)}
              >
                Nouvelle tâche
              </Item>
              <Item
                value="nouveau projet"
                keywords={["créer", "project"]}
                icon={<FolderPlusIcon />}
                shortcut="P"
                onSelect={run(createProject)}
              >
                Nouveau projet
              </Item>
              <Item
                value="nouvel espace"
                keywords={["créer", "workspace", "espace de travail"]}
                icon={<LayoutGridIcon />}
                onSelect={run(createWorkspace)}
              >
                Nouvel espace de travail
              </Item>
              <Item
                value="changer de theme"
                keywords={["thème", "sombre", "clair", "dark", "light"]}
                icon={isDark ? <SunIcon /> : <MoonIcon />}
                onSelect={run(() => setTheme(isDark ? "light" : "dark"))}
              >
                {isDark ? "Passer au thème clair" : "Passer au thème sombre"}
              </Item>
              <Item
                value="se deconnecter"
                keywords={["déconnexion", "logout", "quitter"]}
                icon={<LogOutIcon />}
                onSelect={run(() => logout())}
              >
                Se déconnecter
              </Item>
            </Command.Group>

            {!!workspaces?.documents.length && (
              <Command.Group heading="Espaces de travail" className={groupClasses}>
                {workspaces.documents.map((workspace) => (
                  <Item
                    key={workspace.$id}
                    value={`espace ${workspace.name} ${workspace.$id}`}
                    icon={<LayoutGridIcon />}
                    onSelect={go(`/workspaces/${workspace.$id}`)}
                  >
                    {workspace.name}
                    {workspace.$id === workspaceId && (
                      <span className="ml-2 text-xs text-muted-foreground">Actuel</span>
                    )}
                  </Item>
                ))}
              </Command.Group>
            )}
          </Command.List>
        </Command>
      </DialogContent>
    </Dialog>
  );
};

export const SidebarSearch = () => {
  const palette = useCommandPalette();

  return (
    <div className="shrink-0 border-t border-sidebar-border p-3">
      <button
        type="button"
        onClick={palette.open}
        className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
      >
        <SearchIcon className="size-4" />
        <span className="flex-1 text-left">Rechercher</span>
        <Kbd>⌘K</Kbd>
      </button>
      <AppVersion className="mt-2 block px-2.5" />
    </div>
  );
};
