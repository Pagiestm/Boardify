import { toast } from "sonner";
import { InferRequestType, InferResponseType } from "hono";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { client } from "@/lib/rpc";

type ResponseType = InferResponseType<typeof client.api.workspaces[":workspaceId"]["$patch"], 200>;
type RequestType = InferRequestType<typeof client.api.workspaces[":workspaceId"]["$patch"]>;

export const useUpdateWorkspace = () => {
    const queryClient = useQueryClient()

    const mutation = useMutation<
        ResponseType,
        Error,
        RequestType
    >({
        mutationFn: async ({ form, param }) => {
            if (form.image instanceof File && form.image.size > 1048576) { // 1MB = 1048576 bytes
                throw new Error("L'image dépasse 1Mo");
            }

            const response = await client.api.workspaces[":workspaceId"]["$patch"]({ form, param })

            if (!response.ok) {
                throw new Error("Failed to update workspace")
            }

            return await response.json();
        },
        onSuccess: ({ data }) => {
            toast.success("Espace de travail mis à jour")

            queryClient.invalidateQueries({ queryKey: ["workspaces"] })
            queryClient.invalidateQueries({ queryKey: ["workspace", data.$id] })
        },
        onError: (error) => {
            if (error.message === "L'image dépasse 1Mo") {
                toast.error(error.message);
            } else {
                toast.error("Échec de la mise à jour de l'espace de travail")
            }
        },
    })

    return mutation;
}