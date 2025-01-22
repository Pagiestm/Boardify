import { toast } from "sonner";
import { InferRequestType, InferResponseType } from "hono";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { client } from "@/lib/rpc";

type ResponseType = InferResponseType<typeof client.api.projects["$post"], 200>;
type RequestType = InferRequestType<typeof client.api.projects["$post"]>;

export const useCreateProject = () => {
    const queryClient = useQueryClient()

    const mutation = useMutation<
        ResponseType,
        Error,
        RequestType
    >({
        mutationFn: async ({ form }) => {
            if (form.image instanceof File && form.image.size > 1048576) { // 1MB = 1048576 bytes
                throw new Error("L'image dépasse 1Mo");
            }

            const response = await client.api.projects["$post"]({ form })

            if (!response.ok) {
                throw new Error("Erreur lors de la création du projet")
            }

            return await response.json();
        },
        onSuccess: () => {
            toast.success("Projet créé")
            queryClient.invalidateQueries({ queryKey: ["projects"] })
        },
        onError: (error) => {
            if (error.message === "L'image dépasse 1Mo") {
                toast.error(error.message);
            } else {
                toast.error("Erreur lors de la création du projet");
            }
        },
    })

    return mutation;
}