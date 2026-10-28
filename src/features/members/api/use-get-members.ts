import { useQuery } from "@tanstack/react-query";

import { client } from "@/lib/rpc";
import { HttpError, httpErrorMessage } from "@/lib/http-error";

interface useGetMembersProps {
  workspaceId: string;
  enabled?: boolean;
}

export const useGetMembers = ({ workspaceId, enabled = true }: useGetMembersProps) => {
  const query = useQuery({
    enabled,
    queryKey: ["members", workspaceId],
    queryFn: async () => {
      const response = await client.api.members.$get({ query: { workspaceId } });

      if (!response.ok) {
        throw new HttpError(
          response.status,
          httpErrorMessage(response.status, "Erreur lors de la récupération des membres"),
        );
      }

      const { data } = await response.json();

      return data;
    },
  });

  return query;
};
