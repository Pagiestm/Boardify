import {
    CheckCircle2Icon,
    ChevronsUpDownIcon,
    HomeIcon,
    PlusIcon,
    SearchIcon,
    SettingsIcon,
    UsersIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { LogoMark } from "@/components/brand/logo";

import { MiniAvatar, PreviewKanban } from "./preview-data";

const navItems = [
    { label: "Accueil", icon: HomeIcon },
    { label: "Mes tâches", icon: CheckCircle2Icon, active: true },
    { label: "Paramètres", icon: SettingsIcon },
    { label: "Membres", icon: UsersIcon },
];

const projects = [
    { name: "Site vitrine", color: "bg-green-500", active: true },
    { name: "App mobile", color: "bg-blue-500" },
    { name: "Refonte du logo", color: "bg-amber-500" },
];

/** Static, illustrative preview of the app: sidebar + kanban board. */
export const AppPreview = () => {
    return (
        <div
            aria-hidden
            className="overflow-hidden rounded-xl border bg-background shadow-lg shadow-black/5 select-none"
        >
            <div className="flex">
                <aside className="hidden w-52 shrink-0 flex-col gap-5 border-r bg-sidebar p-3 md:flex">
                    <div className="flex items-center gap-2 px-1">
                        <LogoMark className="size-5" />
                        <span className="text-sm font-semibold">Boardify</span>
                    </div>
                    <div className="flex items-center gap-2 rounded-md border bg-background px-2 py-1.5">
                        <span className="flex size-5 items-center justify-center rounded bg-green-100 text-[10px] font-semibold text-green-700 dark:bg-green-500/20 dark:text-green-300">
                            S
                        </span>
                        <span className="flex-1 truncate text-xs font-medium">Studio Nova</span>
                        <ChevronsUpDownIcon className="size-3.5 text-muted-foreground" />
                    </div>
                    <nav className="flex flex-col gap-0.5">
                        {navItems.map(({ label, icon: Icon, active }) => (
                            <span
                                key={label}
                                className={cn(
                                    "flex items-center gap-2 rounded-md px-2 py-1.5 text-xs",
                                    active ? "bg-sidebar-accent font-medium text-foreground" : "text-muted-foreground"
                                )}
                            >
                                <Icon className={cn("size-3.5", active && "text-primary")} />
                                {label}
                            </span>
                        ))}
                    </nav>
                    <div className="flex flex-col gap-0.5">
                        <p className="px-2 pb-1 text-[11px] font-medium text-muted-foreground">Projets</p>
                        {projects.map((project) => (
                            <span
                                key={project.name}
                                className={cn(
                                    "flex items-center gap-2 rounded-md px-2 py-1.5 text-xs",
                                    project.active ? "bg-sidebar-accent font-medium" : "text-muted-foreground"
                                )}
                            >
                                <span className={cn("size-2 rounded-sm", project.color)} />
                                {project.name}
                            </span>
                        ))}
                    </div>
                </aside>
                <div className="min-w-0 flex-1">
                    <div className="flex h-12 items-center justify-between gap-3 border-b px-4">
                        <div className="min-w-0">
                            <p className="truncate text-sm font-semibold">Site vitrine</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="hidden items-center gap-2 rounded-md border px-2 py-1 text-xs text-muted-foreground sm:flex">
                                <SearchIcon className="size-3.5" />
                                Rechercher…
                                <span className="rounded border bg-muted px-1 text-[10px]">⌘K</span>
                            </span>
                            <div className="flex -space-x-1.5">
                                {["Léa", "Hugo", "Sam"].map((name) => (
                                    <MiniAvatar key={name} name={name} className="ring-2 ring-background" />
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center justify-between gap-3 px-4 pt-3">
                        <div className="flex items-center gap-1 rounded-md bg-muted p-0.5 text-xs">
                            <span className="rounded px-2 py-1 text-muted-foreground">Tableau</span>
                            <span className="rounded bg-background px-2 py-1 font-medium shadow-xs">Kanban</span>
                            <span className="rounded px-2 py-1 text-muted-foreground">Calendrier</span>
                        </div>
                        <span className="flex items-center gap-1 rounded-md bg-primary px-2 py-1 text-xs font-medium text-primary-foreground">
                            <PlusIcon className="size-3.5" />
                            <span className="hidden sm:inline">Nouvelle tâche</span>
                        </span>
                    </div>
                    <div className="overflow-hidden p-4">
                        <PreviewKanban />
                    </div>
                </div>
            </div>
        </div>
    );
};
