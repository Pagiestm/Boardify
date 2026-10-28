import { z } from "zod";
import { Hono } from "hono";
import { Query, type Databases } from "node-appwrite";
import { zValidator } from "@hono/zod-validator";
import { createHmac, randomBytes, timingSafeEqual } from "crypto";

import { Task } from "@/features/tasks/types";
import { Member } from "@/features/members/types";
import { Project } from "@/features/projects/types";
import { getMember } from "@/features/members/utils";
import { Workspace } from "@/features/workspaces/types";

import { createAdminClient } from "@/lib/appwrite";
import { sessionMiddleware } from "@/lib/session-middleware";
import { DATABASE_ID, MEMBERS_ID, PROJECTS_ID, TASKS_ID, WORKSPACES_ID } from "@/config";

import { buildCalendar } from "./ics";

type CalendarMember = Member & { calendarToken?: string | null };

const appUrl = () => process.env.NEXT_PUBLIC_APP_URL!;

const sign = (memberId: string, nonce: string) =>
  createHmac("sha256", process.env.NEXT_APPWRITE_KEY!)
    .update(`calendar:${memberId}:${nonce}`)
    .digest("hex");

const feedUrl = (member: CalendarMember) =>
  member.calendarToken
    ? `${appUrl()}/api/calendar/feed/${member.$id}/${sign(member.$id, member.calendarToken)}.ics`
    : null;

const getCurrentMember = async (databases: Databases, workspaceId: string, userId: string) => {
  const member = await getMember({ databases, workspaceId, userId });
  return member ? databases.getDocument<CalendarMember>(DATABASE_ID, MEMBERS_ID, member.$id) : null;
};

const workspaceQuery = z.object({ workspaceId: z.string().min(1) });

const app = new Hono()
  .get("/feed/:memberId/:file", async (c) => {
    const { memberId, file } = c.req.param();
    const signature = file.replace(/\.ics$/, "");
    const { databases } = await createAdminClient();

    const member = await databases
      .getDocument<CalendarMember>(DATABASE_ID, MEMBERS_ID, memberId)
      .catch(() => null);

    const expected = member?.calendarToken ? sign(member.$id, member.calendarToken) : null;
    if (
      !member ||
      !expected ||
      signature.length !== expected.length ||
      !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
    ) {
      return c.text("Not found", 404);
    }

    const [workspace, { documents: tasks }, { documents: projects }] = await Promise.all([
      databases.getDocument<Workspace>(DATABASE_ID, WORKSPACES_ID, member.workspaceId),
      databases.listDocuments<Task>(DATABASE_ID, TASKS_ID, [
        Query.equal("workspaceId", member.workspaceId),
        Query.equal("assigneeId", member.$id),
        Query.limit(5000),
      ]),
      databases.listDocuments<Project>(DATABASE_ID, PROJECTS_ID, [
        Query.equal("workspaceId", member.workspaceId),
        Query.limit(5000),
      ]),
    ]);

    const body = buildCalendar({
      name: `Boardify · ${workspace.name}`,
      appUrl: appUrl(),
      tasks,
      projects: new Map(projects.map((project) => [project.$id, project])),
    });

    return c.body(body, 200, {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="boardify.ics"',
      "Cache-Control": "private, max-age=300",
    });
  })
  .get("/subscription", sessionMiddleware, zValidator("query", workspaceQuery), async (c) => {
    const databases = c.get("databases");
    const { workspaceId } = c.req.valid("query");

    const member = await getCurrentMember(databases, workspaceId, c.get("user").$id);
    if (!member) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    return c.json({ data: { url: feedUrl(member) } });
  })
  .post("/subscription", sessionMiddleware, zValidator("json", workspaceQuery), async (c) => {
    const databases = c.get("databases");
    const { workspaceId } = c.req.valid("json");

    const member = await getCurrentMember(databases, workspaceId, c.get("user").$id);
    if (!member) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const updated = await databases.updateDocument<CalendarMember>(
      DATABASE_ID,
      MEMBERS_ID,
      member.$id,
      { calendarToken: randomBytes(16).toString("hex") },
    );

    return c.json({ data: { url: feedUrl(updated) } });
  })
  .delete("/subscription", sessionMiddleware, zValidator("query", workspaceQuery), async (c) => {
    const databases = c.get("databases");
    const { workspaceId } = c.req.valid("query");

    const member = await getCurrentMember(databases, workspaceId, c.get("user").$id);
    if (!member) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    await databases.updateDocument(DATABASE_ID, MEMBERS_ID, member.$id, { calendarToken: null });

    return c.json({ data: { url: null } });
  });

export default app;
