import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { client } from "@/lib/rpc";

const account = client.api.account;

/** Lit la réponse d'une requête et lève le message d'erreur du serveur. */
const read = async <T>(response: Response, fallback: string): Promise<T> => {
  const body = (await response.json().catch(() => null)) as { data?: T; error?: string } | null;
  if (!response.ok || !body || body.data === undefined) {
    throw new Error(body?.error ?? fallback);
  }
  return body.data;
};

export interface AccountProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  hasPassword: boolean;
  createdAt: string;
}

export interface AccountIdentity {
  id: string;
  provider: string;
  email: string;
  createdAt: string;
}

export interface AccountWorkspace {
  id: string;
  name: string;
  imageUrl: string | null;
  role: string;
  memberCount: number;
  leaveBlocker: string | null;
}

export const useAccount = () =>
  useQuery({
    queryKey: ["account"],
    queryFn: async () =>
      read<AccountProfile>(await account.$get(), "Impossible de charger votre compte"),
  });

/** Rafraîchit tout ce qui affiche le nom, l'e-mail ou la photo de l'utilisateur. */
/**
 * Applique tout de suite le changement au profil affiché, puis rafraîchit ce qui montre
 * le nom, l'e-mail ou la photo (le cache du serveur peut mettre un instant à se vider).
 */
const useRefreshIdentity = () => {
  const queryClient = useQueryClient();
  return (patch: Partial<Pick<AccountProfile, "name" | "email" | "avatarUrl">>) => {
    queryClient.setQueryData<AccountProfile>(["account"], (old) => old && { ...old, ...patch });
    queryClient.setQueryData<Record<string, unknown>>(["current"], (old) => {
      if (!old) return old;
      const next: Record<string, unknown> = { ...old };
      if (patch.name !== undefined) next.name = patch.name;
      if (patch.email !== undefined) next.email = patch.email;
      if ("avatarUrl" in patch) {
        const avatarId = patch.avatarUrl
          ? new URL(patch.avatarUrl, "http://x").searchParams.get("v")
          : null;
        next.prefs = { ...(old.prefs as object), avatarId };
      }
      return next;
    });
    for (const key of ["members", "tasks", "task"]) {
      queryClient.invalidateQueries({ queryKey: [key] });
    }
  };
};

export const useUpdateName = () => {
  const refresh = useRefreshIdentity();
  return useMutation({
    mutationFn: async (name: string) =>
      read<{ name: string }>(
        await account.name.$patch({ json: { name } }),
        "Impossible de changer le nom",
      ),
    onSuccess: ({ name }) => {
      toast.success("Nom mis à jour");
      refresh({ name });
    },
    onError: (error) => toast.error(error.message),
  });
};

export const useUpdateEmail = () => {
  const refresh = useRefreshIdentity();
  return useMutation({
    mutationFn: async (json: { email: string; password: string }) =>
      read<{ email: string }>(
        await account.email.$patch({ json }),
        "Impossible de changer l'adresse e-mail",
      ),
    onSuccess: ({ email }) => {
      toast.success("Adresse e-mail mise à jour");
      refresh({ email });
    },
    onError: (error) => toast.error(error.message),
  });
};

export const useUpdatePassword = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (json: { password: string; oldPassword?: string }) =>
      read(await account.password.$patch({ json }), "Impossible de changer le mot de passe"),
    onSuccess: () => {
      toast.success("Mot de passe mis à jour");
      queryClient.invalidateQueries({ queryKey: ["account"] });
    },
    onError: (error) => toast.error(error.message),
  });
};

export const useUploadAvatar = () => {
  const refresh = useRefreshIdentity();
  return useMutation({
    mutationFn: async (image: File) =>
      read<{ avatarUrl?: string }>(
        await account.avatar.$post({ form: { image } }),
        "Impossible d'enregistrer la photo",
      ),
    onSuccess: ({ avatarUrl }) => {
      toast.success("Photo de profil mise à jour");
      refresh({ avatarUrl });
    },
    onError: (error) => toast.error(error.message),
  });
};

export const useRemoveAvatar = () => {
  const refresh = useRefreshIdentity();
  return useMutation({
    mutationFn: async () => read(await account.avatar.$delete(), "Impossible de retirer la photo"),
    onSuccess: () => {
      toast.success("Photo de profil retirée");
      refresh({ avatarUrl: undefined });
    },
    onError: (error) => toast.error(error.message),
  });
};

export const useIdentities = () =>
  useQuery({
    queryKey: ["account", "identities"],
    queryFn: async () =>
      read<AccountIdentity[]>(
        await account.identities.$get(),
        "Impossible de charger les comptes liés",
      ),
  });

export const useRemoveIdentity = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (identityId: string) =>
      read(
        await account.identities[":identityId"].$delete({ param: { identityId } }),
        "Impossible de délier ce compte",
      ),
    onSuccess: () => {
      toast.success("Compte délié");
      queryClient.invalidateQueries({ queryKey: ["account", "identities"] });
    },
    onError: (error) => toast.error(error.message),
  });
};

export const useMyWorkspaces = () =>
  useQuery({
    queryKey: ["account", "workspaces"],
    queryFn: async () =>
      read<AccountWorkspace[]>(
        await account.workspaces.$get(),
        "Impossible de charger vos espaces",
      ),
  });

export const useLeaveWorkspace = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (workspaceId: string) =>
      read(
        await account.workspaces[":workspaceId"].leave.$post({ param: { workspaceId } }),
        "Impossible de quitter cet espace",
      ),
    onSuccess: () => {
      toast.success("Vous avez quitté l'espace");
      queryClient.invalidateQueries({ queryKey: ["account", "workspaces"] });
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      queryClient.invalidateQueries({ queryKey: ["members"] });
    },
    onError: (error) => toast.error(error.message),
  });
};

export const useDeleteAccount = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (email: string) =>
      read(await account.$delete({ json: { email } }), "Impossible de supprimer le compte"),
    onSuccess: () => {
      toast.success("Votre compte a été supprimé");
      queryClient.clear();
      router.replace("/");
      router.refresh();
    },
    onError: (error) => toast.error(error.message),
  });
};
