import { z } from "zod";
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";

import { Task } from "@/features/tasks/types";
import { getMember } from "@/features/members/utils";
import { isDoneStatus } from "@/features/tasks/server/done";
import { ActivityType } from "@/features/activities/types";
import { logActivities } from "@/features/activities/server/activities";

import { sessionMiddleware } from "@/lib/session-middleware";
import type { Db } from "@/lib/db";

import { SprintStats, sprintFormSchema } from "../types";
import { listSprintTasks, validateSprint } from "./sprints";
import { computeBurndown } from "./burndown";

const getProjectMember = async (db: Db, projectId: string, userId: string) => {
  const project = await db.projects.get(projectId);
  const member = await getMember({ db, workspaceId: project.workspaceId, userId });
  return { project, member };
};

const getSprintMember = async (db: Db, sprintId: string, userId: string) => {
  const sprint = await db.sprints.get(sprintId);
  const { project, member } = await getProjectMember(db, sprint.projectId, userId);
  return { sprint, project, member };
};

const moveTasks = async (db: Db, tasks: Task[], sprintId: string | null, memberId: string) => {
  for (let index = 0; index < tasks.length; index += 25) {
    await Promise.all(
      tasks.slice(index, index + 25).map(async (task) => {
        await db.tasks.update(task.$id, { sprintId });
        await logActivities(db, task, memberId, [
          { type: ActivityType.SPRINT, change: { from: task.sprintId ?? null, to: sprintId } },
        ]);
      }),
    );
  }
};

const app = new Hono()
  .get(
    "/",
    sessionMiddleware,
    zValidator("query", z.object({ projectId: z.string().min(1) })),
    async (c) => {
      const db = c.get("db");
      const { projectId } = c.req.valid("query");

      const { project, member } = await getProjectMember(db, projectId, c.get("user").$id);
      if (!member) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const { documents: sprints } = await db.sprints.list({
        where: { projectId },
        orderBy: { startDate: "asc" },
        limit: 200,
      });

      const tasks = await listSprintTasks(
        db,
        sprints.map((sprint) => sprint.$id),
      );

      return c.json({
        data: sprints.map((sprint) => {
          const stats: SprintStats = { tasks: 0, doneTasks: 0, points: 0, donePoints: 0 };

          for (const task of tasks) {
            if (task.sprintId !== sprint.$id) continue;
            const done = isDoneStatus(project, task.status);
            const points = task.estimate ?? 0;
            stats.tasks += 1;
            stats.points += points;
            if (done) {
              stats.doneTasks += 1;
              stats.donePoints += points;
            }
          }

          return { ...sprint, stats };
        }),
      });
    },
  )
  .get("/:sprintId/burndown", sessionMiddleware, async (c) => {
    const db = c.get("db");
    const { sprintId } = c.req.param();

    const { sprint, project, member } = await getSprintMember(db, sprintId, c.get("user").$id);
    if (!member) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const tasks = await listSprintTasks(db, [sprint.$id]);
    return c.json({ data: await computeBurndown(db, sprint, project, tasks) });
  })
  .post(
    "/",
    sessionMiddleware,
    zValidator("json", sprintFormSchema.and(z.object({ projectId: z.string().min(1) }))),
    async (c) => {
      const db = c.get("db");
      const { projectId, name, goal, startDate, endDate } = c.req.valid("json");

      const { project, member } = await getProjectMember(db, projectId, c.get("user").$id);
      if (!member) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const sprint = await db.sprints.create({
        workspaceId: project.workspaceId,
        projectId,
        name,
        goal: goal || null,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        completed: false,
      });

      return c.json({ data: sprint });
    },
  )
  .patch("/:sprintId", sessionMiddleware, zValidator("json", sprintFormSchema), async (c) => {
    const db = c.get("db");
    const { name, goal, startDate, endDate } = c.req.valid("json");

    const { sprint, member } = await getSprintMember(
      db,
      c.req.param("sprintId"),
      c.get("user").$id,
    );
    if (!member) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const updated = await db.sprints.update(sprint.$id, {
      name,
      goal: goal || null,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });

    return c.json({ data: updated });
  })
  .post(
    "/:sprintId/complete",
    sessionMiddleware,
    zValidator("json", z.object({ moveTo: z.string().min(1).nullable() })),
    async (c) => {
      const db = c.get("db");
      const { moveTo } = c.req.valid("json");

      const { sprint, project, member } = await getSprintMember(
        db,
        c.req.param("sprintId"),
        c.get("user").$id,
      );
      if (!member) {
        return c.json({ error: "Unauthorized" }, 401);
      }
      if (sprint.completed) {
        return c.json({ error: "Ce sprint est déjà terminé" }, 400);
      }
      if (moveTo === sprint.$id) {
        return c.json({ error: "Choisissez un autre sprint" }, 400);
      }

      const error = await validateSprint(db, moveTo, sprint.projectId);
      if (error) {
        return c.json({ error }, 400);
      }

      const openTasks = (await listSprintTasks(db, [sprint.$id])).filter(
        (task) => !isDoneStatus(project, task.status),
      );
      await moveTasks(db, openTasks, moveTo, member.$id);

      const updated = await db.sprints.update(sprint.$id, {
        completed: true,
      });

      return c.json({ data: { ...updated, moved: openTasks.length } });
    },
  )
  .delete("/:sprintId", sessionMiddleware, async (c) => {
    const db = c.get("db");

    const { sprint, member } = await getSprintMember(
      db,
      c.req.param("sprintId"),
      c.get("user").$id,
    );
    if (!member) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const tasks = await listSprintTasks(db, [sprint.$id]);
    await moveTasks(db, tasks, null, member.$id);
    await db.sprints.delete(sprint.$id);

    return c.json({ data: { $id: sprint.$id, projectId: sprint.projectId } });
  });

export default app;
