import {
  BellIcon,
  CheckCircle2Icon,
  ChevronsUpDownIcon,
  HomeIcon,
  PlusIcon,
  SearchIcon,
  SettingsIcon,
  SunMoonIcon,
  UsersIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Kbd } from "@/components/ui/kbd";
import { LogoMark } from "@/components/brand/logo";

import { STAGE_HEIGHT, STAGE_WIDTH } from "./timeline";

/**
 * Kit de la fausse interface Boardify des démos. Les éléments que le curseur ou la
 * caméra doivent viser portent `demo="…"` (rendu en `data-demo`).
 */

type DemoProps = { demo?: string; className?: string };

export const NAV_ITEMS = [
  { label: "Accueil", icon: HomeIcon },
  { label: "Mes tâches", icon: CheckCircle2Icon },
  { label: "Membres", icon: UsersIcon },
  { label: "Paramètres", icon: SettingsIcon },
] as const;

export const DEMO_PROJECTS = [
  { name: "Site vitrine", color: "bg-green-500" },
  { name: "App mobile", color: "bg-blue-500" },
];

interface AppFrameProps {
  title: string;
  /** Entrée active de la barre latérale : libellé de navigation ou nom de projet. */
  active?: string;
  workspace?: string;
  children: React.ReactNode;
  /** Éléments posés par-dessus l'application (fenêtres, palette, toasts…). */
  overlay?: React.ReactNode;
}

/** L'application Boardify : barre latérale, barre du haut et contenu. */
export const AppFrame = ({
  title,
  active,
  workspace = "Équipe produit",
  children,
  overlay,
}: AppFrameProps) => (
  <div
    className="relative flex overflow-hidden bg-background text-foreground"
    style={{ width: STAGE_WIDTH, height: STAGE_HEIGHT }}
  >
    <aside className="flex w-[190px] shrink-0 flex-col gap-4 border-r bg-sidebar p-3">
      <div className="flex items-center gap-2 px-1">
        <LogoMark className="size-5" />
        <span className="text-sm font-semibold">Boardify</span>
      </div>
      <div className="flex items-center gap-2 rounded-md border bg-background px-2 py-1.5">
        <span className="flex size-5 items-center justify-center rounded bg-green-100 text-[10px] font-semibold text-green-700 dark:bg-green-500/20 dark:text-green-300">
          {workspace[0]}
        </span>
        <span className="flex-1 truncate text-xs font-medium">{workspace}</span>
        <ChevronsUpDownIcon className="size-3.5 text-muted-foreground" />
      </div>
      <nav className="flex flex-col gap-0.5">
        {NAV_ITEMS.map(({ label, icon: Icon }) => (
          <span
            key={label}
            data-demo={`nav-${label}`}
            className={cn(
              "flex items-center gap-2 rounded-md px-2 py-1.5 text-xs",
              active === label ? "bg-accent font-medium" : "text-muted-foreground",
            )}
          >
            <Icon className="size-3.5" />
            {label}
          </span>
        ))}
      </nav>
      <div className="flex flex-col gap-0.5">
        <span className="flex items-center justify-between px-2 pb-1 text-[11px] font-medium text-muted-foreground">
          Projets
          <PlusIcon data-demo="new-project" className="size-3.5" />
        </span>
        {DEMO_PROJECTS.map((project) => (
          <span
            key={project.name}
            data-demo={`project-${project.name}`}
            className={cn(
              "flex items-center gap-2 rounded-md px-2 py-1.5 text-xs",
              active === project.name ? "bg-accent font-medium" : "text-muted-foreground",
            )}
          >
            <span className={cn("size-2 rounded-full", project.color)} />
            {project.name}
          </span>
        ))}
      </div>
    </aside>
    <div className="flex min-w-0 flex-1 flex-col">
      <header className="flex h-12 shrink-0 items-center gap-3 border-b px-4">
        <span className="text-sm font-semibold">{title}</span>
        <span
          data-demo="search"
          className="ml-auto flex w-44 items-center gap-2 rounded-md border px-2 py-1 text-xs text-muted-foreground"
        >
          <SearchIcon className="size-3.5" />
          Rechercher…
          <Kbd className="ml-auto">⌘K</Kbd>
        </span>
        <BellIcon data-demo="bell" className="size-4 text-muted-foreground" />
        <SunMoonIcon className="size-4 text-muted-foreground" />
        <span className="flex size-6 items-center justify-center rounded-full bg-blue-100 text-[10px] font-semibold text-blue-700 dark:bg-blue-500/20 dark:text-blue-300">
          L
        </span>
      </header>
      <main className="relative min-h-0 flex-1 overflow-hidden p-4">{children}</main>
    </div>
    {overlay}
  </div>
);

interface MockButtonProps extends DemoProps {
  children: React.ReactNode;
  variant?: "primary" | "outline" | "ghost" | "destructive";
  size?: "sm" | "default";
  /** Met le bouton en surbrillance (survol du curseur). */
  hover?: boolean;
}

export const MockButton = ({
  children,
  variant = "primary",
  size = "default",
  hover,
  demo,
  className,
}: MockButtonProps) => (
  <span
    data-demo={demo}
    className={cn(
      "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-md font-medium whitespace-nowrap transition-colors [&_svg]:size-3.5",
      size === "sm" ? "h-7 px-2.5 text-xs" : "h-8 px-3 text-xs",
      variant === "primary" && "bg-primary text-primary-foreground",
      variant === "primary" && hover && "bg-primary/85",
      variant === "outline" && "border bg-background",
      variant === "outline" && hover && "bg-accent",
      variant === "ghost" && hover && "bg-accent",
      variant === "destructive" && "bg-destructive text-white",
      className,
    )}
  >
    {children}
  </span>
);

interface MockFieldProps extends DemoProps {
  label?: string;
  value?: React.ReactNode;
  placeholder?: string;
  /** Affiche le curseur de saisie clignotant. */
  focused?: boolean;
  multiline?: boolean;
}

export const MockField = ({
  label,
  value,
  placeholder,
  focused,
  multiline,
  demo,
  className,
}: MockFieldProps) => (
  <div className={cn("flex flex-col gap-1.5", className)}>
    {label && <span className="text-xs font-medium">{label}</span>}
    <span
      data-demo={demo}
      className={cn(
        "flex rounded-md border bg-background px-2.5 text-xs",
        multiline ? "min-h-16 items-start py-2 leading-relaxed" : "h-8 items-center",
        focused && "border-ring ring-[3px] ring-ring/30",
      )}
    >
      {value ? (
        <span className="whitespace-pre-wrap">{value}</span>
      ) : (
        !focused && <span className="text-muted-foreground">{placeholder}</span>
      )}
      {focused && <span className="ml-px inline-block h-3.5 w-px animate-pulse bg-foreground" />}
    </span>
  </div>
);

interface MockSelectProps extends DemoProps {
  label?: string;
  value: React.ReactNode;
  open?: boolean;
}

export const MockSelect = ({ label, value, open, demo, className }: MockSelectProps) => (
  <div className={cn("flex flex-col gap-1.5", className)}>
    {label && <span className="text-xs font-medium">{label}</span>}
    <span
      data-demo={demo}
      className={cn(
        "flex h-8 items-center justify-between gap-2 rounded-md border bg-background px-2.5 text-xs",
        open && "border-ring ring-[3px] ring-ring/30",
      )}
    >
      <span className="flex min-w-0 items-center gap-1.5 truncate">{value}</span>
      <ChevronsUpDownIcon className="size-3.5 shrink-0 text-muted-foreground" />
    </span>
  </div>
);

/** Liste déroulante ouverte, positionnée par son parent. */
export const MockMenu = ({
  items,
  highlighted,
  className,
  title,
}: {
  items: { id: string; label: React.ReactNode }[];
  highlighted?: string;
  className?: string;
  title?: string;
}) => (
  <div className={cn("z-20 flex flex-col rounded-lg border bg-popover p-1 shadow-lg", className)}>
    {title && <span className="px-2 py-1 text-[11px] text-muted-foreground">{title}</span>}
    {items.map((item) => (
      <span
        key={item.id}
        data-demo={item.id}
        className={cn(
          "flex items-center gap-2 rounded-md px-2 py-1.5 text-xs",
          highlighted === item.id && "bg-accent",
        )}
      >
        {item.label}
      </span>
    ))}
  </div>
);

interface MockDialogProps extends DemoProps {
  title: string;
  description?: string;
  /** Opacité d'apparition, de 0 à 1. */
  visible: number;
  width?: number;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

/** Fenêtre modale centrée sur l'application, avec son voile. */
export const MockDialog = ({
  title,
  description,
  visible,
  width = 460,
  children,
  footer,
  demo,
}: MockDialogProps) =>
  visible > 0 ? (
    <div
      className="absolute inset-0 z-30 flex items-center justify-center bg-black/40"
      style={{ opacity: visible }}
    >
      <div
        data-demo={demo}
        className="flex flex-col gap-4 rounded-xl border bg-background p-5 shadow-2xl"
        style={{ width, transform: `scale(${0.96 + 0.04 * visible})` }}
      >
        <div className="flex flex-col gap-1">
          <span className="text-base font-semibold">{title}</span>
          {description && <span className="text-xs text-muted-foreground">{description}</span>}
        </div>
        {children}
        {footer && <div className="flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  ) : null;

/** Notification « toast » en bas à droite. */
export const MockToast = ({ visible, children }: { visible: number; children: React.ReactNode }) =>
  visible > 0 ? (
    <div
      className="absolute right-4 bottom-4 z-40 flex items-center gap-2 rounded-lg border bg-background px-3 py-2.5 text-xs font-medium shadow-lg"
      style={{ opacity: visible, transform: `translateY(${(1 - visible) * 12}px)` }}
    >
      <CheckCircle2Icon className="size-4 text-primary" />
      {children}
    </div>
  ) : null;

/** Halo autour d'un élément qui vient d'apparaître ou de changer. */
export const highlight = (amount: number) =>
  amount > 0 && amount < 1
    ? {
        boxShadow: `0 0 0 ${3 * (1 - amount)}px color-mix(in oklab, var(--primary) 45%, transparent)`,
      }
    : undefined;
