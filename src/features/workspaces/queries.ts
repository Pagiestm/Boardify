import { cookies } from "next/headers";

import { AUTH_COOKIE } from "@/features/auth/constants";
import { getCurrent } from "@/features/auth/queries";

import { createDb } from "@/lib/db";
import { requestDatabases } from "@/lib/appwrite";

export const getWorkspaces = async () => {
  const session = (await cookies()).get(AUTH_COOKIE)?.value;
  const user = await getCurrent();
  if (!session || !user) throw new Error("Unauthorized");

  const db = createDb(requestDatabases(session));

  const members = await db.members.list({ where: { userId: user.$id }, limit: 100 });

  if (members.total === 0) {
    return { documents: [], total: 0 };
  }

  const workspaceIds = members.documents.map((member) => member.workspaceId);

  const workspaces = await db.workspaces.list({
    where: { $id: workspaceIds },
    orderBy: { $createdAt: "desc" },
    limit: 100,
  });

  return workspaces;
};
