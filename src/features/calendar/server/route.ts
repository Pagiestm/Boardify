import { z } from "zod";
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { createHmac, randomBytes, timingSafeEqual } from "crypto";

import { Member } from "@/features/members/types";
import { getMember } from "@/features/members/utils";

import { createDb, type Collection, type Db } from "@/lib/db";
import { createAdminClient } from "@/lib/appwrite";
import { sessionMiddleware } from "@/lib/session-middleware";

import { buildCalendar } from "./ics";

type CalendarMember = Member & { calendarToken?: string | null };

/** Membres vus avec leur jeton de calendrier. */
const calendarMembers = (db: Db) => db.members as unknown as Collection<CalendarMember>;

const appUrl = () => process.env.NEXT_PUBLIC_APP_URL!;

const sign = (memberId: string, nonce: string) =>
  createHmac("sha256", process.env.NEXT_APPWRITE_KEY!)
    .update(`calendar:${memberId}:${nonce}`)
    .digest("hex");

const feedUrl = (member: CalendarMember) =>
  member.calendarToken
    ? `${appUrl()}/api/calendar/feed/${member.$id}/${sign(member.$id, member.calendarToken)}.ics`
    : null;

const getCurrentMember = async (db: Db, workspaceId: string, userId: string) => {
  const member = await getMember({ db, workspaceId, userId });
  return member ? calendarMembers(db).get(member.$id) : null;
};

const workspaceQuery = z.object({ workspaceId: z.string().min(1) });

const app = new Hono()
  .get("/feed/:memberId/:file", async (c) => {
    const { memberId, file } = c.req.param();
    const signature = file.replace(/\.ics$/, "");
    const { databases } = await createAdminClient();
    const db = createDb(databases);

    const member = await calendarMembers(db)
      .get(memberId)
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
      db.workspaces.get(member.workspaceId),
      db.tasks.list({
        where: { workspaceId: member.workspaceId, assigneeId: member.$id },
        limit: 5000,
      }),
      db.projects.list({ where: { workspaceId: member.workspaceId }, limit: 5000 }),
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
      "Cache-Control": "private, no-cache",
    });
  })
  .get("/subscription", sessionMiddleware, zValidator("query", workspaceQuery), async (c) => {
    const db = c.get("db");
    const { workspaceId } = c.req.valid("query");

    const member = await getCurrentMember(db, workspaceId, c.get("user").$id);
    if (!member) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    return c.json({ data: { url: feedUrl(member) } });
  })
  .post("/subscription", sessionMiddleware, zValidator("json", workspaceQuery), async (c) => {
    const db = c.get("db");
    const { workspaceId } = c.req.valid("json");

    const member = await getCurrentMember(db, workspaceId, c.get("user").$id);
    if (!member) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const updated = await calendarMembers(db).update(member.$id, {
      calendarToken: randomBytes(16).toString("hex"),
    });

    return c.json({ data: { url: feedUrl(updated) } });
  })
  .delete("/subscription", sessionMiddleware, zValidator("query", workspaceQuery), async (c) => {
    const db = c.get("db");
    const { workspaceId } = c.req.valid("query");

    const member = await getCurrentMember(db, workspaceId, c.get("user").$id);
    if (!member) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    await calendarMembers(db).update(member.$id, { calendarToken: null });

    return c.json({ data: { url: null } });
  });

export default app;
