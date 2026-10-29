import { Hono } from "hono";
import { handle } from "hono/vercel";
import { AppwriteException } from "node-appwrite";

import auth from "@/features/auth/server/route";
import members from "@/features/members/server/route";
import workspaces from "@/features/workspaces/server/route";
import projects from "@/features/projects/server/route";
import tasks from "@/features/tasks/server/route";
import labels from "@/features/labels/server/route";
import github from "@/features/github/server/route";
import comments from "@/features/comments/server/route";
import activities from "@/features/activities/server/route";
import notifications from "@/features/notifications/server/route";
import cron from "@/features/cron/server/route";
import checklist from "@/features/checklist/server/route";
import attachments from "@/features/attachments/server/route";
import templates from "@/features/templates/server/route";
import savedViews from "@/features/saved-views/server/route";
import sprints from "@/features/sprints/server/route";
import calendar from "@/features/calendar/server/route";
import assistant from "@/features/assistant/server/route";

const app = new Hono().basePath("/api");

app.onError((error, c) => {
  if (error instanceof AppwriteException && error.code === 404) {
    return c.json({ error: "Not found" }, 404);
  }

  console.error(error);
  return c.json({ error: "Internal Server Error" }, 500);
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const routes = app
  .route("/auth", auth)
  .route("/workspaces", workspaces)
  .route("/members", members)
  .route("/projects", projects)
  .route("/tasks", tasks)
  .route("/labels", labels)
  .route("/github", github)
  .route("/comments", comments)
  .route("/activities", activities)
  .route("/notifications", notifications)
  .route("/cron", cron)
  .route("/checklist", checklist)
  .route("/attachments", attachments)
  .route("/templates", templates)
  .route("/saved-views", savedViews)
  .route("/sprints", sprints)
  .route("/calendar", calendar)
  .route("/assistant", assistant);

export const GET = handle(app);
export const POST = handle(app);
export const PUT = handle(app);
export const PATCH = handle(app);
export const DELETE = handle(app);

export type AppType = typeof routes;
