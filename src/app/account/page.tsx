import { redirect } from "next/navigation";

import { getCurrent } from "@/features/auth/queries";
import { getWorkspaces } from "@/features/workspaces/queries";

/** « Mon compte » s'ouvre dans le premier espace de l'utilisateur. */
export default async function AccountRedirect() {
  const user = await getCurrent();
  if (!user) redirect("/sign-in");

  const workspaces = await getWorkspaces();
  if (workspaces.total === 0) redirect("/workspaces/create");

  redirect(`/workspaces/${workspaces.documents[0].$id}/account`);
}
