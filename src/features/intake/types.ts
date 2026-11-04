import type { BaseDocument } from "@/lib/db/types";

/** Formulaire public d'un projet : chaque envoi crée une tâche. */
export type IntakeForm = BaseDocument & {
  workspaceId: string;
  projectId: string;
  /** Jeton secret de l'adresse publique. */
  token: string;
  enabled?: boolean;
  title: string;
  intro?: string | null;
  /** Membre assigné et statut des tâches créées. */
  assigneeId: string;
  status: string;
};
