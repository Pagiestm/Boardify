import { z } from "zod";
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { endOfMonth, startOfMonth, subMonths } from "date-fns";

import { MemberRole } from "@/features/members/types";
import { forgetMembers, getMember } from "@/features/members/utils";

import { generateInviteCode } from "@/lib/utils";
import { imageDataUrl } from "@/lib/files";
import { sessionMiddleware } from "@/lib/session-middleware";

import { createWorkspaceSchema, updateWorkspaceSchema } from "../schemas";
import { deleteWorkspaceChildren } from "./cleanup";

const app = new Hono()
  .get("/", sessionMiddleware, async (c) => {
    const user = c.get("user");
    const db = c.get("db");

    const members = await db.members.list({ where: { userId: user.$id } });

    if (members.total === 0) {
      return c.json({ data: { documents: [], total: 0 } });
    }

    const workspaceIds = members.documents.map((member) => member.workspaceId);

    const workspaces = await db.workspaces.list({
      where: { $id: workspaceIds },
      orderBy: { $createdAt: "desc" },
    });

    return c.json({ data: workspaces });
  })
  .get("/:workspaceId", sessionMiddleware, async (c) => {
    const user = c.get("user");
    const db = c.get("db");
    const { workspaceId } = c.req.param();

    const member = await getMember({
      db,
      workspaceId,
      userId: user.$id,
    });

    if (!member) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const workspace = await db.workspaces.get(workspaceId);

    return c.json({ data: workspace });
  })
  .get("/:workspaceId/info", sessionMiddleware, async (c) => {
    const db = c.get("db");
    const { workspaceId } = c.req.param();

    const workspace = await db.workspaces.get(workspaceId);

    return c.json({
      data: {
        $id: workspace.$id,
        name: workspace.name,
        imageUrl: workspace.imageUrl,
      },
    });
  })
  .post("/", zValidator("form", createWorkspaceSchema), sessionMiddleware, async (c) => {
    const db = c.get("db");
    const user = c.get("user");

    const { name, image } = c.req.valid("form");

    let uploadedImageUrl: string | undefined;

    if (image instanceof File) {
      uploadedImageUrl = await imageDataUrl(image);
    }

    const workspace = await db.workspaces.create({
      name,
      userId: user.$id,
      imageUrl: uploadedImageUrl,
      inviteCode: generateInviteCode(6),
    });

    await db.members.create({
      userId: user.$id,
      workspaceId: workspace.$id,
      role: MemberRole.ADMIN,
    });

    forgetMembers(workspace.$id);

    return c.json({ data: workspace });
  })

  .patch(
    "/:workspaceId",
    sessionMiddleware,
    zValidator("form", updateWorkspaceSchema),
    async (c) => {
      const db = c.get("db");
      const user = c.get("user");

      const { workspaceId } = c.req.param();
      const { name, image } = c.req.valid("form");

      const member = await getMember({
        db,
        workspaceId,
        userId: user.$id,
      });

      if (!member || member.role !== MemberRole.ADMIN) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      let uploadedImageUrl: string | undefined;

      if (image instanceof File) {
        uploadedImageUrl = await imageDataUrl(image);
      } else {
        uploadedImageUrl = image;
      }

      const workspace = await db.workspaces.update(workspaceId, {
        name,
        imageUrl: uploadedImageUrl,
      });

      return c.json({ data: workspace });
    },
  )
  .delete("/:workspaceId", sessionMiddleware, async (c) => {
    const db = c.get("db");
    const user = c.get("user");

    const { workspaceId } = c.req.param();

    const member = await getMember({
      db,
      workspaceId,
      userId: user.$id,
    });

    if (!member || member.role !== MemberRole.ADMIN) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    await deleteWorkspaceChildren(db, c.get("files"), workspaceId);

    await db.workspaces.delete(workspaceId);

    return c.json({ data: { $id: workspaceId } });
  })
  .post("/:workspaceId/reset-invite-code", sessionMiddleware, async (c) => {
    const db = c.get("db");
    const user = c.get("user");

    const { workspaceId } = c.req.param();

    const member = await getMember({
      db,
      workspaceId,
      userId: user.$id,
    });

    if (!member || member.role !== MemberRole.ADMIN) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const workspace = await db.workspaces.update(workspaceId, {
      inviteCode: generateInviteCode(6),
    });

    return c.json({ data: workspace });
  })
  .post(
    "/:workspaceId/join",
    sessionMiddleware,
    zValidator("json", z.object({ code: z.string() })),
    async (c) => {
      const { workspaceId } = c.req.param();
      const { code } = c.req.valid("json");

      const db = c.get("db");
      const user = c.get("user");

      const member = await getMember({
        db,
        workspaceId,
        userId: user.$id,
      });

      if (member) {
        return c.json({ error: "Already a member" }, 400);
      }

      const workspace = await db.workspaces.get(workspaceId);

      if (workspace.inviteCode !== code) {
        return c.json({ error: "Invalid invite code" }, 400);
      }

      await db.members.create({
        userId: user.$id,
        workspaceId,
        role: MemberRole.MEMBER,
      });

      forgetMembers(workspaceId);

      return c.json({ data: workspace });
    },
  )
  .get("/:workspaceId/analytics", sessionMiddleware, async (c) => {
    const db = c.get("db");
    const user = c.get("user");
    const { workspaceId } = c.req.param();

    const member = await getMember({
      db,
      workspaceId,
      userId: user.$id,
    });

    if (!member) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const now = new Date();
    const thisMonthStart = startOfMonth(now);
    const thisMonthEnd = endOfMonth(now);
    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const lastMonthEnd = endOfMonth(subMonths(now, 1));

    const during = (from: Date, to: Date) => ({
      $createdAt: { gte: from.toISOString(), lte: to.toISOString() },
    });
    const assignedToMe = { assigneeId: member.$id };

    const [taskCount, lastMonthTaskCount, assignedTaskCount, lastMonthAssignedTaskCount] =
      await Promise.all([
        db.tasks.count({ workspaceId, ...during(thisMonthStart, thisMonthEnd) }),
        db.tasks.count({ workspaceId, ...during(lastMonthStart, lastMonthEnd) }),
        db.tasks.count({ workspaceId, ...assignedToMe, ...during(thisMonthStart, thisMonthEnd) }),
        db.tasks.count({ workspaceId, ...assignedToMe, ...during(lastMonthStart, lastMonthEnd) }),
      ]);

    const taskDifference = taskCount - lastMonthTaskCount;
    const assignedTaskDifference = assignedTaskCount - lastMonthAssignedTaskCount;

    return c.json({
      data: {
        taskCount,
        taskDifference,
        assignedTaskCount,
        assignedTaskDifference,
      },
    });
  });

export default app;
