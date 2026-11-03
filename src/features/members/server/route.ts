import { z } from "zod";

import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";

import { getUserIdentities } from "@/lib/users";
import { sessionMiddleware } from "@/lib/session-middleware";

import { forgetMembers, getMember } from "../utils";
import { MemberRole } from "../types";
import { isLastAdmin } from "../rules";

const app = new Hono()
  .get(
    "/",
    sessionMiddleware,
    zValidator("query", z.object({ workspaceId: z.string() })),
    async (c) => {
      const db = c.get("db");
      const user = c.get("user");
      const { workspaceId } = c.req.valid("query");

      const member = await getMember({
        db,
        workspaceId,
        userId: user.$id,
      });

      if (!member) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const members = await db.members.list({ where: { workspaceId } });

      const identities = await getUserIdentities(members.documents.map((member) => member.userId));

      const populatedMembers = members.documents.map((member) => ({
        ...member,
        name: identities.get(member.userId)?.name ?? "",
        email: identities.get(member.userId)?.email ?? "",
        avatarUrl: identities.get(member.userId)?.avatarUrl,
      }));

      return c.json({
        data: {
          ...members,
          documents: populatedMembers,
        },
      });
    },
  )
  .delete("/:memberId", sessionMiddleware, async (c) => {
    const { memberId } = c.req.param();
    const user = c.get("user");
    const db = c.get("db");

    const memberToDelete = await db.members.get(memberId);

    const allMembersInWorkspace = await db.members.list({
      where: { workspaceId: memberToDelete.workspaceId },
    });

    const member = await getMember({
      db,
      workspaceId: memberToDelete.workspaceId,
      userId: user.$id,
    });

    if (!member) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    if (member.$id !== memberToDelete.$id && member.role !== MemberRole.ADMIN) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    if (allMembersInWorkspace.total === 1) {
      return c.json({ error: "Le dernier membre ne peut pas être retiré." }, 400);
    }

    if (isLastAdmin(allMembersInWorkspace.documents, memberToDelete)) {
      return c.json({ error: "Nommez un autre administrateur avant de retirer le dernier." }, 400);
    }

    await db.members.delete(memberId);

    forgetMembers(memberToDelete.workspaceId);

    return c.json({ data: { $id: memberToDelete.$id } });
  })
  .patch(
    "/:memberId",
    sessionMiddleware,
    zValidator("json", z.object({ role: z.nativeEnum(MemberRole) })),
    async (c) => {
      const { memberId } = c.req.param();
      const { role } = c.req.valid("json");
      const user = c.get("user");
      const db = c.get("db");

      const memberToUpdate = await db.members.get(memberId);

      const allMembersInWorkspace = await db.members.list({
        where: { workspaceId: memberToUpdate.workspaceId },
      });

      const member = await getMember({
        db,
        workspaceId: memberToUpdate.workspaceId,
        userId: user.$id,
      });

      if (!member) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      if (member.role !== MemberRole.ADMIN) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      if (
        role !== MemberRole.ADMIN &&
        isLastAdmin(allMembersInWorkspace.documents, memberToUpdate)
      ) {
        return c.json({ error: "Il doit rester au moins un administrateur dans l'espace." }, 400);
      }

      await db.members.update(memberId, { role });

      forgetMembers(memberToUpdate.workspaceId);

      return c.json({ data: { $id: memberToUpdate.$id } });
    },
  );

export default app;
