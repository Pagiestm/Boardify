import { toast } from "sonner";
import { InferRequestType, InferResponseType } from "hono";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { client } from "@/lib/rpc";

type ResponseType = InferResponseType<typeof client.api.projects[":projectId"]["$patch"], 200>;
type RequestType = InferRequestType<typeof client.api.projects[":projectId"]["$patch"]>;

export const useUpdateProject = () => {
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

            const response = await client.api.projects[":projectId"]["$patch"]({ form, param })

            if (!response.ok) {
                throw new Error("Erreur lors de la mise à jour du projet")
            }

            return await response.json();
        },
        onSuccess: ({ data }) => {
            toast.success("Projet mis à jour")
            
            queryClient.invalidateQueries({ queryKey: ["projects"] })
            queryClient.invalidateQueries({ queryKey: ["project", data.$id] })
        },
        onError: (error) => {
            if (error.message === "L'image dépasse 1Mo") {
                toast.error(error.message);
            } else {
                toast.error("Erreur lors de la mis à jour du projet");
            }
        },
    })

    return mutation;
}