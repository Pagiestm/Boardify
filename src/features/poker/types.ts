import type { BaseDocument } from "@/lib/db/types";

/** Séance d'estimation d'une tâche : son identifiant est celui de la tâche. */
export type PokerSession = BaseDocument & {
  workspaceId: string;
  taskId: string;
  startedBy: string;
  /** Tour en cours : un nouveau tour repart de votes vides. */
  round: number;
  revealed?: boolean;
};

export type PokerVote = BaseDocument & {
  workspaceId: string;
  taskId: string;
  memberId: string;
  round: number;
  value: string;
};
