import { useQuery } from "@tanstack/react-query";

import { client } from "@/lib/rpc";

export const useGetWorkspaces = () => {
    const query = useQuery({
        queryKey: ["workspaces"],
        queryFn: async () => {
            const response = await client.api.workspaces.$get();

            if (!response.ok) {
                throw new Error("Échec de la récupération des espaces de travail");
            }

            const { data } = await response.json();

            return data;
        }
    })

    return query;
}