import { toast } from "sonner";
import { InferRequestType, InferResponseType } from "hono";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { client } from "@/lib/rpc";

type ResponseType = InferResponseType<typeof client.api.projects[":projectId"]["$delete"], 200>;
type RequestType = InferRequestType<typeof client.api.projects[":projectId"]["$delete"]>;

export const useDeleteProject = () => {
    const queryClient = useQueryClient()

    const mutation = useMutation<
        ResponseType,
        Error,
        RequestType
    >({
        mutationFn: async ({ param }) => {
            const response = await client.api.projects[":projectId"]["$delete"]({ param })

            if (!response.ok) {
                throw new Error("Erreur lors de la suppression du projet")
            }

            return await response.json();
        },
        onSuccess: ({ data }) => {
            toast.success("Projet supprimé")
            
            queryClient.invalidateQueries({ queryKey: ["projects"] })
            queryClient.invalidateQueries({ queryKey: ["projects", data.$id] })
        },
        onError: () => {
            toast.error("Erreur lors de la suppression du projet")
        },
    })

    return mutation;
}