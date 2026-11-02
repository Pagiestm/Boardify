"use client";

import { useCurrent } from "@/features/auth/api/use-current";
import { useGetMembers } from "@/features/members/api/use-get-members";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";

import { useTaskFilters } from "./use-task-filters";

/** Valeur du filtre « Tous les membres » quand la page montre par défaut ses propres tâches. */
export const ALL_MEMBERS = "all";

/**
 * Membre à filtrer. Sur « Mes tâches » (`mine`), c'est l'utilisateur lui-même tant qu'il n'a
 * pas choisi un autre membre ou « Tous les membres ».
 */
export const useAssigneeFilter = (mine?: boolean) => {
  const [{ assigneeId }] = useTaskFilters();
  const workspaceId = useWorkspaceId();
  const { data: user } = useCurrent();
  const { data: members } = useGetMembers({ workspaceId });
  const me = members?.documents.find((member) => member.userId === user?.$id)?.$id ?? null;

  if (assigneeId === ALL_MEMBERS) return { assigneeId: null, ready: true, me };
  if (assigneeId || !mine) return { assigneeId, ready: true, me };
  return { assigneeId: me, ready: me !== null, me };
};
