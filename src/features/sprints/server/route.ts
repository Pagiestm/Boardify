import { z } from "zod";
import { Hono } from "hono";
import { ID, Query, type Databases } from "node-appwrite";
import { zValidator } from "@hono/zod-validator";

import { Task } from "@/features/tasks/types";
import { Project } from "@/features/projects/types";
import { getMember } from "@/features/members/utils";
import { isDoneStatus } from "@/features/tasks/server/done";
import { ActivityType } from "@/features/activities/types";
import { logActivities } from "@/features/activities/server/activities";

import { sessionMiddleware } from "@/lib/session-middleware";
import { DATABASE_ID, PROJECTS_ID, SPRINTS_ID, TASKS_ID } from "@/config";

import { Sprint, SprintStats, sprintFormSchema } from "../types";
import { listSprintTasks, validateSprint } from "./sprints";

const getProjectMember = async (databases: Databases, projectId: string, userId: string) => {
  const project = await databases.getDocument<Project>(DATABASE_ID, PROJECTS_ID, projectId);
  const member = await getMember({ databases, workspaceId: project.workspaceId, userId });
  return { project, member };
};

const getSprintMember = async (databases: Databases, sprintId: string, userId: string) => {
  const sprint = await databases.getDocument<Sprint>(DATABASE_ID, SPRINTS_ID, sprintId);
  const { project, member } = await getProjectMember(databases, sprint.projectId, userId);
  return { sprint, project, member };
};

const moveTasks = async (
  databases: Databases,
  tasks: Task[],
  sprintId: string | null,
  memberId: string,
) => {
  for (let index = 0; index < tasks.length; index += 25) {
    await Promise.all(
      tasks.slice(index, index + 25).map(async (task) => {
        await databases.updateDocument(DATABASE_ID, TASKS_ID, task.$id, { sprintId });
        await logActivities(databases, task, memberId, [
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
      const databases = c.get("databases");
      const { projectId } = c.req.valid("query");

      const { project, member } = await getProjectMember(databases, projectId, c.get("user").$id);
      if (!member) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const { documents: sprints } = await databases.listDocuments<Sprint>(
        DATABASE_ID,
        SPRINTS_ID,
        [Query.equal("projectId", projectId), Query.orderAsc("startDate"), Query.limit(200)],
      );

      const tasks = await listSprintTasks(
        databases,
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
  .post(
    "/",
    sessionMiddleware,
    zValidator("json", sprintFormSchema.and(z.object({ projectId: z.string().min(1) }))),
    async (c) => {
      const databases = c.get("databases");
      const { projectId, name, goal, startDate, endDate } = c.req.valid("json");

      const { project, member } = await getProjectMember(databases, projectId, c.get("user").$id);
      if (!member) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const sprint = await databases.createDocument<Sprint>(DATABASE_ID, SPRINTS_ID, ID.unique(), {
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
    const databases = c.get("databases");
    const { name, goal, startDate, endDate } = c.req.valid("json");

    const { sprint, member } = await getSprintMember(
      databases,
      c.req.param("sprintId"),
      c.get("user").$id,
    );
    if (!member) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const updated = await databases.updateDocument<Sprint>(DATABASE_ID, SPRINTS_ID, sprint.$id, {
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
      const databases = c.get("databases");
      const { moveTo } = c.req.valid("json");

      const { sprint, project, member } = await getSprintMember(
        databases,
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

      const error = await validateSprint(databases, moveTo, sprint.projectId);
      if (error) {
        return c.json({ error }, 400);
      }

      const openTasks = (await listSprintTasks(databases, [sprint.$id])).filter(
        (task) => !isDoneStatus(project, task.status),
      );
      await moveTasks(databases, openTasks, moveTo, member.$id);

      const updated = await databases.updateDocument<Sprint>(DATABASE_ID, SPRINTS_ID, sprint.$id, {
        completed: true,
      });

      return c.json({ data: { ...updated, moved: openTasks.length } });
    },
  )
  .delete("/:sprintId", sessionMiddleware, async (c) => {
    const databases = c.get("databases");

    const { sprint, member } = await getSprintMember(
      databases,
      c.req.param("sprintId"),
      c.get("user").$id,
    );
    if (!member) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const tasks = await listSprintTasks(databases, [sprint.$id]);
    await moveTasks(databases, tasks, null, member.$id);
    await databases.deleteDocument(DATABASE_ID, SPRINTS_ID, sprint.$id);

    return c.json({ data: { $id: sprint.$id, projectId: sprint.projectId } });
  });

export default app;
