/**
 * Schéma Postgres de Boardify. Chaque table reprend les champs de la collection Appwrite du même
 * nom ; les clés TypeScript sont les noms utilisés par le code, les colonnes sont en snake_case.
 *
 * Après une modification : `npm run db:generate` crée la migration SQL dans `drizzle/`.
 */
import {
  boolean,
  doublePrecision,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

const date = (name: string) => timestamp(name, { withTimezone: true, mode: "date" });

/** Identifiant et dates de création et de modification, communs à toutes les tables. */
const base = {
  id: text("id").primaryKey(),
  createdAt: date("created_at").notNull().defaultNow(),
  updatedAt: date("updated_at").notNull().defaultNow(),
};

export const workspaces = pgTable(
  "workspaces",
  {
    ...base,
    name: text("name").notNull(),
    imageUrl: text("image_url"),
    inviteCode: text("invite_code").notNull(),
    userId: text("user_id").notNull(),
    githubInstallationId: text("github_installation_id"),
  },
  (table) => [uniqueIndex().on(table.inviteCode), index().on(table.githubInstallationId)],
);

export const members = pgTable(
  "members",
  {
    ...base,
    workspaceId: text("workspace_id").notNull(),
    userId: text("user_id").notNull(),
    role: text("role").notNull(),
    calendarToken: text("calendar_token"),
  },
  (table) => [uniqueIndex().on(table.workspaceId, table.userId), index().on(table.userId)],
);

export const projects = pgTable(
  "projects",
  {
    ...base,
    name: text("name").notNull(),
    imageUrl: text("image_url"),
    workspaceId: text("workspace_id").notNull(),
    columnConfig: text("column_config"),
    githubRepo: text("github_repo"),
  },
  (table) => [index().on(table.workspaceId), index().on(table.githubRepo)],
);

export const tasks = pgTable(
  "tasks",
  {
    ...base,
    name: text("name").notNull(),
    status: text("status").notNull(),
    workspaceId: text("workspace_id").notNull(),
    assigneeId: text("assignee_id"),
    projectId: text("project_id").notNull(),
    position: doublePrecision("position").notNull().default(0),
    dueDate: date("due_date"),
    startDate: date("start_date"),
    priority: text("priority"),
    description: text("description"),
    labelIds: text("label_ids").array().default([]),
    githubIssueUrl: text("github_issue_url"),
    blockedBy: text("blocked_by").array().default([]),
    recurrence: text("recurrence"),
    sprintId: text("sprint_id"),
    estimate: integer("estimate"),
  },
  (table) => [
    index().on(table.workspaceId, table.status),
    index().on(table.projectId),
    index().on(table.assigneeId),
    index().on(table.sprintId),
    index().on(table.dueDate),
    index().on(table.githubIssueUrl),
  ],
);

export const labels = pgTable(
  "labels",
  {
    ...base,
    name: text("name").notNull(),
    color: text("color").notNull(),
    workspaceId: text("workspace_id").notNull(),
  },
  (table) => [index().on(table.workspaceId)],
);

export const comments = pgTable(
  "comments",
  {
    ...base,
    workspaceId: text("workspace_id").notNull(),
    taskId: text("task_id").notNull(),
    memberId: text("member_id").notNull(),
    content: text("content").notNull(),
    githubCommentId: text("github_comment_id"),
  },
  (table) => [index().on(table.taskId), index().on(table.githubCommentId)],
);

export const activities = pgTable(
  "activities",
  {
    ...base,
    workspaceId: text("workspace_id").notNull(),
    taskId: text("task_id").notNull(),
    memberId: text("member_id"),
    type: text("type").notNull(),
    data: text("data"),
  },
  (table) => [index().on(table.taskId), index().on(table.workspaceId)],
);

export const notifications = pgTable(
  "notifications",
  {
    ...base,
    workspaceId: text("workspace_id").notNull(),
    userId: text("user_id").notNull(),
    taskId: text("task_id").notNull(),
    actorId: text("actor_id"),
    type: text("type").notNull(),
    read: boolean("read").notNull().default(false),
  },
  (table) => [index().on(table.userId, table.read), index().on(table.taskId)],
);

export const checklistItems = pgTable(
  "checklist_items",
  {
    ...base,
    workspaceId: text("workspace_id").notNull(),
    taskId: text("task_id").notNull(),
    title: text("title").notNull(),
    done: boolean("done").notNull().default(false),
    position: doublePrecision("position").notNull().default(0),
  },
  (table) => [index().on(table.taskId)],
);

export const attachments = pgTable(
  "attachments",
  {
    ...base,
    workspaceId: text("workspace_id").notNull(),
    taskId: text("task_id").notNull(),
    memberId: text("member_id").notNull(),
    fileId: text("file_id").notNull(),
    name: text("name").notNull(),
    mimeType: text("mime_type"),
    size: integer("size").notNull().default(0),
  },
  (table) => [index().on(table.taskId), index().on(table.workspaceId)],
);

export const taskTemplates = pgTable(
  "task_templates",
  {
    ...base,
    workspaceId: text("workspace_id").notNull(),
    name: text("name").notNull(),
    data: text("data").notNull(),
  },
  (table) => [index().on(table.workspaceId)],
);

export const savedViews = pgTable(
  "saved_views",
  {
    ...base,
    workspaceId: text("workspace_id").notNull(),
    memberId: text("member_id").notNull(),
    name: text("name").notNull(),
    view: text("view").notNull(),
    filters: text("filters").notNull(),
  },
  (table) => [index().on(table.workspaceId, table.memberId)],
);

export const sprints = pgTable(
  "sprints",
  {
    ...base,
    workspaceId: text("workspace_id").notNull(),
    projectId: text("project_id").notNull(),
    name: text("name").notNull(),
    goal: text("goal"),
    startDate: date("start_date").notNull(),
    endDate: date("end_date").notNull(),
    completed: boolean("completed").notNull().default(false),
  },
  (table) => [index().on(table.projectId), index().on(table.workspaceId)],
);

export const aiSettings = pgTable(
  "ai_settings",
  {
    ...base,
    workspaceId: text("workspace_id").notNull(),
    provider: text("provider").notNull(),
    model: text("model").notNull(),
    baseUrl: text("base_url"),
    apiKeyEncrypted: text("api_key_encrypted").notNull(),
    apiKeyHint: text("api_key_hint"),
    enabled: boolean("enabled").notNull().default(true),
    updatedBy: text("updated_by"),
  },
  (table) => [uniqueIndex().on(table.workspaceId)],
);

/** Un document par membre : son identifiant est celui du membre. */
export const presence = pgTable(
  "presence",
  {
    ...base,
    workspaceId: text("workspace_id").notNull(),
    memberId: text("member_id").notNull(),
    location: text("location").notNull(),
    seenAt: date("seen_at").notNull(),
  },
  (table) => [index().on(table.workspaceId)],
);

/*
 * Comptes et sessions de Better Auth (connexion avec AUTH_PROVIDER=better-auth). Les noms de
 * champs sont ceux attendus par Better Auth ; `prefs` reprend les préférences Appwrite (JSON).
 */

export const authUsers = pgTable("auth_users", {
  ...base,
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  prefs: text("prefs"),
});

export const authSessions = pgTable(
  "auth_sessions",
  {
    ...base,
    expiresAt: date("expires_at").notNull(),
    token: text("token").notNull().unique(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
  },
  (table) => [index().on(table.userId)],
);

export const authAccounts = pgTable(
  "auth_accounts",
  {
    ...base,
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: date("access_token_expires_at"),
    refreshTokenExpiresAt: date("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
  },
  (table) => [index().on(table.userId)],
);

export const authVerifications = pgTable(
  "auth_verifications",
  {
    ...base,
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: date("expires_at").notNull(),
  },
  (table) => [index().on(table.identifier)],
);
