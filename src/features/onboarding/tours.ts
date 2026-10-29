export interface TourStep {
  /** Élément mis en lumière (`data-tour="…"`). Sans cible, la bulle s'affiche au centre. */
  target?: string;
  title: string;
  body: string;
}

export interface Tour {
  id: string;
  label: string;
  /** La visite correspond à cette page. */
  match: (pathname: string) => boolean;
  /** Élément attendu avant de lancer la visite (la page a fini de charger). */
  waitFor: string;
  steps: TourStep[];
}

const WORKSPACE = "^/workspaces/[^/]+";

const route = (pattern: string) => {
  const regex = new RegExp(`${WORKSPACE}${pattern}/?$`);
  return (pathname: string) => regex.test(pathname);
};

export const TOURS: Tour[] = [
  {
    id: "home",
    label: "Accueil",
    match: route(""),
    waitFor: "analytics",
    steps: [
      {
        title: "Bienvenue sur Boardify 👋",
        body: "Une visite rapide pour découvrir votre espace. Vous pourrez la relancer à tout moment depuis le menu de votre compte.",
      },
      {
        target: "workspace-switcher",
        title: "Vos espaces de travail",
        body: "Passez d'un espace à l'autre, ou créez-en un nouveau avec le bouton +.",
      },
      {
        target: "navigation",
        title: "Navigation",
        body: "L'accueil, vos tâches, les membres et les paramètres de l'espace. Au clavier : G puis H, T, M ou S.",
      },
      {
        target: "projects",
        title: "Vos projets",
        body: "Chaque projet a son Kanban, ses vues et ses sprints. Créez-en un avec + ou la touche P.",
      },
      {
        target: "search",
        title: "Tout trouver avec ⌘K",
        body: "Pages, projets, actions et espaces de travail. Avec l'assistant IA, posez aussi une question sur vos tâches.",
      },
      {
        target: "notifications",
        title: "Notifications",
        body: "Une tâche qui vous est assignée, une mention ou une échéance demain : tout arrive ici.",
      },
      {
        target: "getting-started",
        title: "Premiers pas",
        body: "Quelques étapes pour bien démarrer. Elles se cochent au fur et à mesure.",
      },
      {
        target: "focus-card",
        title: "Ma journée",
        body: "L'assistant IA choisit vos tâches prioritaires du jour et explique pourquoi.",
      },
      {
        target: "workload",
        title: "La charge de l'équipe",
        body: "Le travail restant de chacun sur les prochaines semaines, en tâches ou en points.",
      },
      {
        target: "user-menu",
        title: "Besoin d'aide ?",
        body: "Le menu de votre compte donne accès au guide d'utilisation, aux raccourcis clavier et à cette visite.",
      },
    ],
  },
  {
    id: "project",
    label: "Projet",
    match: route("/projects/[^/]+"),
    waitFor: "view-tabs",
    steps: [
      {
        target: "view-tabs",
        title: "Quatre vues",
        body: "Tableau, Kanban, Calendrier et Frise : touches 1 à 4. Dans le Kanban, glissez les cartes d'une colonne à l'autre et personnalisez les colonnes avec leur menu …",
      },
      {
        target: "new-task",
        title: "Nouvelle tâche",
        body: "Ou appuyez sur N, depuis n'importe quelle page.",
      },
      {
        target: "filters",
        title: "Filtres",
        body: "Par statut, membre, étiquette ou échéance.",
      },
      {
        target: "saved-views",
        title: "Vues enregistrées",
        body: "Mémorisez vos filtres et votre vue pour les retrouver en un clic.",
      },
      {
        target: "sprint-bar",
        title: "Sprints",
        body: "Planifiez des itérations avec un objectif, suivez leur avancement et la charge de chacun, puis terminez-les.",
      },
      {
        target: "project-assistant",
        title: "Assistant IA",
        body: "Point d'avancement, bilan, notes de version, tâches depuis un compte rendu, estimations.",
      },
      {
        target: "project-settings",
        title: "Paramètres du projet",
        body: "Nom, icône et dépôt GitHub synchronisé avec les tâches.",
      },
    ],
  },
  {
    id: "task",
    label: "Tâche",
    match: route("/tasks/[^/]+"),
    waitFor: "task-overview",
    steps: [
      {
        target: "task-description",
        title: "Description",
        body: "Modifiez-la avec la touche I, enregistrez avec ⌘S. L'assistant IA peut aussi la rédiger.",
      },
      {
        target: "task-checklist",
        title: "Sous-tâches",
        body: "Une liste à cocher avec sa barre de progression.",
      },
      {
        target: "task-attachments",
        title: "Pièces jointes",
        body: "Glissez un fichier ici, jusqu'à 10 Mo.",
      },
      {
        target: "task-activity",
        title: "Activité et commentaires",
        body: "Chaque changement est retracé. Tapez @ pour mentionner quelqu'un et ⌘↵ pour envoyer.",
      },
      {
        target: "task-overview",
        title: "Détails",
        body: "Statut, priorité, période, sprint, dépendances… Modifiez-les avec la touche E.",
      },
      {
        target: "task-header",
        title: "Modèle",
        body: "Enregistrez cette tâche comme modèle pour la réutiliser à la création d'une nouvelle.",
      },
    ],
  },
  {
    id: "settings",
    label: "Paramètres",
    match: route("/settings"),
    waitFor: "settings-general",
    steps: [
      {
        target: "settings-general",
        title: "Votre espace",
        body: "Son nom et son icône.",
      },
      {
        target: "settings-invite",
        title: "Inviter des membres",
        body: "Partagez ce lien avec vos collègues. Réinitialisez-le si besoin : l'ancien cesse de fonctionner.",
      },
      {
        target: "settings-github",
        title: "GitHub",
        body: "Connectez vos dépôts : tâches et issues restent synchronisées dans les deux sens.",
      },
      {
        target: "settings-assistant",
        title: "Assistant IA",
        body: "Branchez l'IA de votre choix avec votre propre clé d'API.",
      },
      {
        target: "settings-templates",
        title: "Modèles de tâche",
        body: "Les modèles enregistrés depuis vos tâches, réutilisables à la création.",
      },
    ],
  },
];

export const findTour = (pathname: string) => TOURS.find((tour) => tour.match(pathname));
