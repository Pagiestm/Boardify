import { Hono } from "hono";
import { handle } from "hono/vercel";
import * as Sentry from "@sentry/nextjs";
import type { ContentfulStatusCode } from "hono/utils/http-status";

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
import account from "@/features/account/server/route";
import realtime from "@/features/realtime/server/route";
import presence from "@/features/presence/server/route";

import { isNotFound } from "@/lib/db";
import { AUTH_PROVIDER, isAuthError, type AuthError } from "@/lib/auth";
import { getBetterAuth } from "@/lib/auth/better-auth";

/** Erreurs de connexion attendues (mauvais mot de passe…) : un statut HTTP, sans alerte Sentry. */
const AUTH_STATUS: Record<AuthError["reason"], ContentfulStatusCode> = {
  invalid_credentials: 401,
  unauthorized: 401,
  email_taken: 409,
  invalid_value: 400,
  password_recently_used: 400,
  password_personal_data: 400,
  invalid_token: 400,
  missing_scope: 500,
  unknown: 500,
};

const app = new Hono().basePath("/api");

app.onError((error, c) => {
  if (isNotFound(error)) {
    return c.json({ error: "Not found" }, 404);
  }
  if (isAuthError(error) && AUTH_STATUS[error.reason] < 500) {
    return c.json({ error: error.reason }, AUTH_STATUS[error.reason]);
  }

  console.error(error);
  Sentry.captureException(error);
  return c.json({ error: "Internal Server Error" }, 500);
});

// Retours de Google et GitHub, gérés par Better Auth quand il assure la connexion.
app.on(["GET", "POST"], "/better-auth/*", (c) =>
  AUTH_PROVIDER === "better-auth" ? getBetterAuth().handler(c.req.raw) : c.notFound(),
);

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
  .route("/assistant", assistant)
  .route("/account", account)
  .route("/realtime", realtime)
  .route("/presence", presence);

export const GET = handle(app);
export const POST = handle(app);
export const PUT = handle(app);
export const PATCH = handle(app);
export const DELETE = handle(app);

export type AppType = typeof routes;
