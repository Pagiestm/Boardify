import { z } from "zod";
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";

import { getMember } from "@/features/members/utils";
import type { Sprint } from "@/features/sprints/types";

import { sessionMiddleware } from "@/lib/session-middleware";

import { buildPortfolio } from "../portfolio";

const app = new Hono().get(
  "/",
  sessionMiddleware,
  zValidator("query", z.object({ workspaceId: z.string().min(1) })),
  async (c) => {
    const db = c.get("db");
    const { workspaceId } = c.req.valid("query");

    const member = await getMember({ db, workspaceId, userId: c.get("user").$id });
    if (!member) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    // Une requête par collection pour tout l'espace, puis le calcul se fait en mémoire.
    const [projects, tasks, sprints] = await Promise.all([
      db.projects.list({ where: { workspaceId }, orderBy: { $createdAt: "asc" }, limit: 500 }),
      db.tasks.list({ where: { workspaceId }, limit: 5000 }),
      db.sprints.enabled
        ? db.sprints.list({ where: { workspaceId }, limit: 1000 })
        : Promise.resolve({ documents: [] as Sprint[], total: 0 }),
    ]);

    return c.json({
      data: buildPortfolio({
        projects: projects.documents,
        tasks: tasks.documents,
        sprints: sprints.documents,
      }),
    });
  },
);

export default app;
