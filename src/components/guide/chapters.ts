import { FaGithub } from "react-icons/fa";
import {
  BellIcon,
  FlagIcon,
  FolderKanbanIcon,
  HouseIcon,
  KeyboardIcon,
  LayoutGridIcon,
  ListChecksIcon,
  MonitorIcon,
  RocketIcon,
  SparklesIcon,
  UsersIcon,
} from "lucide-react";

export interface GuideChapter {
  id: string;
  title: string;
  summary: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const GUIDE_CHAPTERS: GuideChapter[] = [
  {
    id: "demarrer",
    title: "Démarrer",
    summary: "Créer son compte, son premier espace et se repérer dans l'interface.",
    icon: RocketIcon,
  },
  {
    id: "equipe",
    title: "Inviter l'équipe",
    summary: "Le lien d'invitation, les rôles Admin et Membre.",
    icon: UsersIcon,
  },
  {
    id: "projets",
    title: "Projets et colonnes",
    summary: "Créer un projet et adapter ses colonnes à votre façon de travailler.",
    icon: FolderKanbanIcon,
  },
  {
    id: "taches",
    title: "Les tâches",
    summary: "Créer, détailler, commenter, répéter et réutiliser vos tâches.",
    icon: ListChecksIcon,
  },
  {
    id: "vues",
    title: "Vues et filtres",
    summary: "Tableau, Kanban, Calendrier, Frise, filtres et vues enregistrées.",
    icon: LayoutGridIcon,
  },
  {
    id: "sprints",
    title: "Sprints",
    summary: "Planifier des itérations, suivre leur avancement et les clôturer.",
    icon: FlagIcon,
  },
  {
    id: "accueil",
    title: "Accueil et statistiques",
    summary: "Échéances, charge de l'équipe et activité en un coup d'œil.",
    icon: HouseIcon,
  },
  {
    id: "notifications",
    title: "Notifications et agenda",
    summary: "Rester informé et retrouver ses échéances dans son calendrier.",
    icon: BellIcon,
  },
  {
    id: "github",
    title: "GitHub",
    summary: "Synchroniser tâches, issues, branches et pull requests.",
    icon: FaGithub,
  },
  {
    id: "assistant",
    title: "Assistant IA",
    summary: "Brancher votre IA et la laisser préparer, rédiger et planifier.",
    icon: SparklesIcon,
  },
  {
    id: "desktop",
    title: "Application desktop",
    summary: "Ajout rapide, barre des menus et notifications natives.",
    icon: MonitorIcon,
  },
  {
    id: "raccourcis",
    title: "Raccourcis clavier",
    summary: "La palette ⌘K et tous les raccourcis pour aller plus vite.",
    icon: KeyboardIcon,
  },
];
