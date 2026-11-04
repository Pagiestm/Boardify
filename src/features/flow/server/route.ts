import { z } from "zod";
import { Hono } from "hono";
import { endOfDay, startOfDay, subDays } from "date-fns";
import { zValidator } from "@hono/zod-validator";

import { getMember } from "@/features/members/utils";
import { parseBoardColumns } from "@/features/projects/utils";
import { Activity, ActivityType } from "@/features/activities/types";

import { sessionMiddleware } from "@/lib/session-middleware";
import type { Db } from "@/lib/db";

import { buildFlowMetrics } from "../metrics";

/** Changements de statut des tâches, par lots de 100 identifiants. */
const listStatusActivities = async (db: Db, taskIds: string[]) => {
  const activities: Activity[] = [];
  for (let index = 0; index < taskIds.length; index += 100) {
    const { documents } = await db.activities.list({
      where: {
        taskId: taskIds.slice(index, index + 100),
        type: [ActivityType.STATUS, ActivityType.GITHUB_CLOSED, ActivityType.GITHUB_REOPENED],
      },
      limit: 5000,
    });
    activities.push(...documents);
  }
  return activities;
};

const app = new Hono().get(
  "/",
  sessionMiddleware,
  zValidator(
    "query",
    z.object({
      projectId: z.string().min(1),
      sprintId: z.string().min(1).optional(),
      days: z.coerce.number().int().min(7).max(90).default(30),
    }),
  ),
  async (c) => {
    const db = c.get("db");
    const { projectId, sprintId, days } = c.req.valid("query");

    const project = await db.projects.find(projectId);
    if (!project) {
      return c.json({ error: "Projet introuvable" }, 404);
    }
    const member = await getMember({
      db,
      workspaceId: project.workspaceId,
      userId: c.get("user").$id,
    });
    if (!member) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    // Un sprint précis : il doit appartenir au projet ; la période est alors celle du sprint.
    const sprint = sprintId && db.sprints.enabled ? await db.sprints.find(sprintId) : null;
    if (sprintId && sprint?.projectId !== project.$id) {
      return c.json({ error: "Sprint introuvable dans ce projet" }, 404);
    }

    const now = new Date();
    const period = sprint
      ? { start: startOfDay(new Date(sprint.startDate)), end: endOfDay(new Date(sprint.endDate)) }
      : { start: startOfDay(subDays(now, days - 1)), end: now };

    const { documents: tasks } = await db.tasks.list({
      where: { projectId: project.$id, ...(sprint ? { sprintId: sprint.$id } : {}) },
      limit: 5000,
    });
    const activities = await listStatusActivities(
      db,
      tasks.map((task) => task.$id),
    );

    return c.json({
      data: buildFlowMetrics({
        tasks,
        activities,
        columns: parseBoardColumns(project.columnConfig),
        period,
        now,
      }),
    });
  },
);

export default app;
