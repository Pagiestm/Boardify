import type { RealtimeChange, RealtimeTopic } from "../types";

/** Changement reçu d'une source, avant filtrage pour un abonné. */
export interface RealtimeEvent {
  topic: RealtimeTopic;
  /** Espace concerné (pour un espace : son propre identifiant). */
  workspaceId?: string;
  taskId?: string;
  /** Destinataire, pour les notifications. */
  userId?: string;
}

/** Abonnement d'un utilisateur aux changements d'un espace. */
export interface RealtimeSubscriber {
  workspaceId: string;
  userId: string;
  /** Session de l'utilisateur (utilisée par la source Appwrite). */
  session: string;
  /** La source écoute : les changements suivants seront transmis. */
  onReady: () => void;
  onChange: (change: RealtimeChange) => void;
  /** La source s'est arrêtée : le navigateur se reconnectera et rattrapera le retard. */
  onClose: () => void;
}

/** S'abonne aux changements ; renvoie la fonction de désabonnement. */
export type Subscribe = (subscriber: RealtimeSubscriber) => () => void;
