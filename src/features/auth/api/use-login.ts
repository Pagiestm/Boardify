import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { InferRequestType, InferResponseType } from "hono";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { client } from "@/lib/rpc";

type ResponseType = InferResponseType<typeof client.api.auth.login["$post"]>;
type RequestType = InferRequestType<typeof client.api.auth.login["$post"]>;

export const useLogin = () => {
    const router = useRouter();
    const queryClient = useQueryClient()

    const mutation = useMutation<
        ResponseType,
        Error,
        RequestType
    >({
        mutationFn: async ({ json }) => {
            const response = await client.api.auth.login["$post"]({ json })

            if (!response.ok) {
                throw new Error("Erreur lors de la connexion")
            }

            return await response.json();
        },
        onSuccess: () => {
            toast.success("Connexion réussie")
            router.refresh()
            queryClient.invalidateQueries({ queryKey: ["current"] })
        },
        onError: () => {
            toast.error("Erreur lors de la connexion")
        }
    })

    return mutation;
}