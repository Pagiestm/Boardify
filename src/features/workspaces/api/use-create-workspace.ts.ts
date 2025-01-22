import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { InferRequestType, InferResponseType } from "hono";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { client } from "@/lib/rpc";

type ResponseType = InferResponseType<typeof client.api.workspaces["$post"]>;
type RequestType = InferRequestType<typeof client.api.workspaces["$post"]>;

export const useCreateWorkspace = () => {
    const router = useRouter();
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
            
            const response = await client.api.workspaces["$post"]({ form })

            if (!response.ok) {
                throw new Error("Failed to create workspace")
            }

            return await response.json();
        },
        onSuccess: () => {
            toast.success("Espace de travail créé")

            router.refresh()
            queryClient.invalidateQueries({ queryKey: ["workspaces"] })
        },
        onError: (error) => {
            if (error.message === "L'image dépasse 1Mo") {
                toast.error(error.message);
            } else {
                toast.error("Échec de la création de l'espace de travail")
            }
        },
    })

    return mutation;
}