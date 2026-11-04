import type { ProjectHealth } from "./portfolio";

export const HEALTH_CONFIG: Record<ProjectHealth, { label: string; badge: string; dot: string }> = {
  "off-track": {
    label: "En retard",
    badge: "bg-rose-500/10 text-rose-700 dark:text-rose-400",
    dot: "bg-rose-500",
  },
  "at-risk": {
    label: "À surveiller",
    badge: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
    dot: "bg-amber-500",
  },
  "on-track": {
    label: "En bonne voie",
    badge: "bg-primary/10 text-primary",
    dot: "bg-primary",
  },
  done: {
    label: "Terminé",
    badge: "bg-muted text-muted-foreground",
    dot: "bg-muted-foreground",
  },
  empty: {
    label: "Sans tâche",
    badge: "bg-muted text-muted-foreground",
    dot: "bg-muted-foreground/50",
  },
};
