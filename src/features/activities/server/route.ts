import { z } from "zod";
import { Hono } from "hono";
import { Query } from "node-appwrite";
import { zValidator } from "@hono/zod-validator";

import { Task } from "@/features/tasks/types";
import { getMember } from "@/features/members/utils";

import { sessionMiddleware } from "@/lib/session-middleware";
import { ACTIVITIES_ID, DATABASE_ID, TASKS_ID } from "@/config";

import { Activity } from "../types";

const app = new Hono().get(
  "/",
  sessionMiddleware,
  zValidator("query", z.object({ taskId: z.string().min(1) })),
  async (c) => {
    const databases = c.get("databases");
    const { taskId } = c.req.valid("query");

    const task = await databases.getDocument<Task>(DATABASE_ID, TASKS_ID, taskId);
    const member = await getMember({
      databases,
      workspaceId: task.workspaceId,
      userId: c.get("user").$id,
    });

    if (!member) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const activities = await databases.listDocuments<Activity>(DATABASE_ID, ACTIVITIES_ID, [
      Query.equal("taskId", taskId),
      Query.orderAsc("$createdAt"),
      Query.limit(500),
    ]);

    return c.json({ data: activities.documents });
  },
);

export default app;
