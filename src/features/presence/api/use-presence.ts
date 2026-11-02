import { useQuery } from "@tanstack/react-query";

import { client } from "@/lib/rpc";

export interface PresenceEntry {
  memberId: string;
  location: string;
}

/** Membres de l'espace présents en ce moment, et la page qu'ils consultent. */
export const usePresence = (workspaceId: string | undefined) =>
  useQuery({
    queryKey: ["presence", workspaceId],
    enabled: Boolean(workspaceId),
    refetchInterval: 30_000,
    queryFn: async (): Promise<PresenceEntry[]> => {
      const response = await client.api.presence.$get({ query: { workspaceId: workspaceId! } });
      if (!response.ok) return [];
      const body = (await response.json()) as { data?: PresenceEntry[] };
      return body.data ?? [];
    },
  });
