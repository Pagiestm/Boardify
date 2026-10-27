import { z } from "zod";
import { Hono } from "hono";
import type { Databases } from "node-appwrite";
import { randomBytes } from "crypto";
import { zValidator } from "@hono/zod-validator";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";

import { getMember } from "@/features/members/utils";
import { MemberRole } from "@/features/members/types";
import { Task } from "@/features/tasks/types";
import { Project } from "@/features/projects/types";
import { Workspace } from "@/features/workspaces/types";

import { DATABASE_ID, PROJECTS_ID, TASKS_ID, WORKSPACES_ID } from "@/config";
import { createAdminClient } from "@/lib/appwrite";
import { forgetSession, sessionMiddleware } from "@/lib/session-middleware";
import { AUTH_COOKIE } from "@/features/auth/constants";
import {
  createGithubLinkedBranch,
  getGithubDevelopment,
  getGithubInstallation,
  getGithubInstallUrl,
  getGithubOAuthUrl,
  getGithubUserFromCode,
  isGithubAppConfigured,
  listGithubRepositories,
  listUserInstallationIds,
  verifyGithubWebhook,
} from "@/lib/github";

import { ACCOUNT_STATE_PREFIX } from "../constants";
import { importGithubIssues } from "./import";
import { handleGithubWebhook } from "./webhook";
import { forgetGithubLogin, GithubAccountPrefs, resolveGithubAccount } from "./accounts";

const STATE_COOKIE = "boardify-github-state";
const ACCOUNT_STATE_COOKIE = "boardify-github-account-state";

const stateCookieOptions = {
  path: "/",
  httpOnly: true,
  secure: true,
  sameSite: "Strict",
  maxAge: 60 * 10,
} as const;

// Tâche liée à une issue et installation GitHub de son espace, pour un membre de l'espace
const getLinkedTask = async (databases: Databases, userId: string, taskId: string) => {
  const task = await databases.getDocument<Task>(DATABASE_ID, TASKS_ID, taskId);
  const member = await getMember({ databases, workspaceId: task.workspaceId, userId });
  if (!member) return { error: "Unauthorized" as const };

  const workspace = await databases.getDocument<Workspace>(
    DATABASE_ID,
    WORKSPACES_ID,
    task.workspaceId,
  );
  if (!task.githubIssueUrl || !workspace.githubInstallationId) {
    return { error: "Tâche non liée à une issue GitHub" as const };
  }

  return {
    task,
    issueUrl: task.githubIssueUrl,
    installationId: workspace.githubInstallationId,
  };
};

const app = new Hono()
  // Appelé par GitHub, sans session : l'authenticité est garantie par la signature HMAC
  .post("/webhook", async (c) => {
    const payload = await c.req.text();

    if (!verifyGithubWebhook(payload, c.req.header("X-Hub-Signature-256"))) {
      return c.json({ error: "Signature invalide" }, 401);
    }

    const eventName = c.req.header("X-GitHub-Event") ?? "";
    const { databases } = await createAdminClient();

    try {
      const result = await handleGithubWebhook(databases, eventName, JSON.parse(payload));
      return c.json({ data: { result } });
    } catch (error) {
      console.error(`Webhook GitHub ${eventName} impossible à traiter`, error);
      return c.json({ error: "Traitement impossible" }, 500);
    }
  })
  .get(
    "/install",
    sessionMiddleware,
    zValidator("query", z.object({ workspaceId: z.string().min(1) })),
    async (c) => {
      const databases = c.get("databases");
      const user = c.get("user");
      const { workspaceId } = c.req.valid("query");

      if (!isGithubAppConfigured()) {
        return c.json({ error: "GitHub App non configurée" }, 501);
      }

      const member = await getMember({ databases, workspaceId, userId: user.$id });

      if (!member || member.role !== MemberRole.ADMIN) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const state = randomBytes(16).toString("hex");

      setCookie(c, STATE_COOKIE, `${state}:${workspaceId}`, stateCookieOptions);

      return c.redirect(getGithubInstallUrl(state));
    },
  )
  .post(
    "/installations",
    sessionMiddleware,
    zValidator(
      "json",
      z.object({
        installationId: z.string().regex(/^\d+$/).optional(),
        state: z.string().min(1).optional(),
        code: z.string().min(1),
      }),
    ),
    async (c) => {
      const databases = c.get("databases");
      const user = c.get("user");
      const { installationId, state, code } = c.req.valid("json");

      const [expectedState, workspaceId] = getCookie(c, STATE_COOKIE)?.split(":") ?? [];
      deleteCookie(c, STATE_COOKIE, { path: "/" });

      // GitHub ne renvoie pas toujours le state : le cookie suffit alors à prouver que le flux
      // a été lancé depuis Boardify, la vérification d'accès se faisant via le code OAuth
      if (!expectedState || !workspaceId || (state && expectedState !== state)) {
        return c.json({ error: "Lien de connexion expiré, recommencez" }, 400);
      }

      const member = await getMember({ databases, workspaceId, userId: user.$id });

      if (!member || member.role !== MemberRole.ADMIN) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const userInstallationIds = await listUserInstallationIds(code);
      const linkedInstallationId =
        installationId ?? (userInstallationIds.length === 1 ? userInstallationIds[0] : undefined);

      if (!linkedInstallationId || !userInstallationIds.includes(linkedInstallationId)) {
        return c.json({ error: "Installation GitHub inaccessible" }, 403);
      }

      await databases.updateDocument(DATABASE_ID, WORKSPACES_ID, workspaceId, {
        githubInstallationId: linkedInstallationId,
      });

      return c.json({ data: { workspaceId } });
    },
  )
  .delete("/installations/:workspaceId", sessionMiddleware, async (c) => {
    const databases = c.get("databases");
    const user = c.get("user");
    const { workspaceId } = c.req.param();

    const member = await getMember({ databases, workspaceId, userId: user.$id });

    if (!member || member.role !== MemberRole.ADMIN) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    await databases.updateDocument(DATABASE_ID, WORKSPACES_ID, workspaceId, {
      githubInstallationId: null,
    });

    return c.json({ data: { workspaceId } });
  })
  .get(
    "/account/link",
    sessionMiddleware,
    zValidator("query", z.object({ workspaceId: z.string().min(1) })),
    async (c) => {
      const { workspaceId } = c.req.valid("query");

      if (!isGithubAppConfigured()) {
        return c.json({ error: "GitHub App non configurée" }, 501);
      }

      const state = randomBytes(16).toString("hex");
      setCookie(c, ACCOUNT_STATE_COOKIE, `${state}:${workspaceId}`, stateCookieOptions);

      const redirectUri = `${new URL(c.req.url).origin}/github/callback`;
      return c.redirect(getGithubOAuthUrl(`${ACCOUNT_STATE_PREFIX}${state}`, redirectUri));
    },
  )
  .post(
    "/account",
    sessionMiddleware,
    zValidator("json", z.object({ state: z.string().min(1), code: z.string().min(1) })),
    async (c) => {
      const account = c.get("account");
      const user = c.get("user");
      const { state, code } = c.req.valid("json");

      const [expectedState, workspaceId] = getCookie(c, ACCOUNT_STATE_COOKIE)?.split(":") ?? [];
      deleteCookie(c, ACCOUNT_STATE_COOKIE, { path: "/" });

      if (!expectedState || `${ACCOUNT_STATE_PREFIX}${expectedState}` !== state) {
        return c.json({ error: "Lien de connexion expiré, recommencez" }, 400);
      }

      const githubUser = await getGithubUserFromCode(code);
      if (!githubUser) {
        return c.json({ error: "Autorisation GitHub refusée" }, 403);
      }

      await account.updatePrefs({
        ...user.prefs,
        githubLogin: githubUser.login,
        githubId: githubUser.id,
      } satisfies GithubAccountPrefs);
      forgetGithubLogin(user.$id);
      forgetSession(getCookie(c, AUTH_COOKIE)!);

      return c.json({ data: { workspaceId, login: githubUser.login } });
    },
  )
  .delete("/account", sessionMiddleware, async (c) => {
    const account = c.get("account");
    const user = c.get("user");

    const prefs: Record<string, unknown> & GithubAccountPrefs = { ...user.prefs };
    delete prefs.githubLogin;
    delete prefs.githubId;
    await account.updatePrefs(prefs);
    forgetGithubLogin(user.$id);
    forgetSession(getCookie(c, AUTH_COOKIE)!);

    return c.json({ data: { userId: user.$id } });
  })
  .post("/projects/:projectId/import", sessionMiddleware, async (c) => {
    const databases = c.get("databases");
    const user = c.get("user");
    const { projectId } = c.req.param();

    const project = await databases.getDocument<Project>(DATABASE_ID, PROJECTS_ID, projectId);
    const member = await getMember({
      databases,
      workspaceId: project.workspaceId,
      userId: user.$id,
    });

    if (!member) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const workspace = await databases.getDocument<Workspace>(
      DATABASE_ID,
      WORKSPACES_ID,
      project.workspaceId,
    );
    const { githubRepo } = project;

    if (!workspace.githubInstallationId || !githubRepo) {
      return c.json({ error: "Projet non lié à un dépôt GitHub" }, 400);
    }

    const result = await importGithubIssues({
      databases,
      project: { ...project, githubRepo },
      installationId: workspace.githubInstallationId,
      fallbackMemberId: member.$id,
    });

    return c.json({ data: { ...result, projectId, workspaceId: project.workspaceId } });
  })
  .get("/tasks/:taskId/development", sessionMiddleware, async (c) => {
    const linked = await getLinkedTask(
      c.get("databases"),
      c.get("user").$id,
      c.req.param("taskId"),
    );

    if ("error" in linked) {
      return c.json({ error: linked.error }, linked.error === "Unauthorized" ? 401 : 400);
    }

    try {
      return c.json({ data: await getGithubDevelopment(linked.installationId, linked.issueUrl) });
    } catch (error) {
      console.error("Lecture du développement GitHub impossible", error);
      return c.json({ error: "Lecture de GitHub impossible" }, 502);
    }
  })
  .post("/tasks/:taskId/branch", sessionMiddleware, async (c) => {
    const linked = await getLinkedTask(
      c.get("databases"),
      c.get("user").$id,
      c.req.param("taskId"),
    );

    if ("error" in linked) {
      return c.json({ error: linked.error }, linked.error === "Unauthorized" ? 401 : 400);
    }

    try {
      const branch = await createGithubLinkedBranch(
        linked.installationId,
        linked.issueUrl,
        linked.task.name,
      );
      return c.json({ data: { branch, taskId: linked.task.$id } });
    } catch (error) {
      console.error("Création de la branche GitHub impossible", error);
      return c.json({ error: "Création de la branche impossible" }, 502);
    }
  })
  .get("/:workspaceId", sessionMiddleware, async (c) => {
    const databases = c.get("databases");
    const user = c.get("user");
    const { workspaceId } = c.req.param();

    const member = await getMember({ databases, workspaceId, userId: user.$id });

    if (!member) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const canManage = member.role === MemberRole.ADMIN;

    if (!isGithubAppConfigured()) {
      return c.json({ data: { canManage, configured: false, broken: false, connection: null } });
    }

    const workspace = await databases.getDocument<Workspace>(
      DATABASE_ID,
      WORKSPACES_ID,
      workspaceId,
    );

    if (!workspace.githubInstallationId) {
      return c.json({ data: { canManage, configured: true, broken: false, connection: null } });
    }

    try {
      const { users } = await createAdminClient();
      const [installation, repositories, viewer] = await Promise.all([
        getGithubInstallation(workspace.githubInstallationId),
        listGithubRepositories(workspace.githubInstallationId),
        resolveGithubAccount(users, user.$id, workspace.githubInstallationId).catch(() => null),
      ]);

      return c.json({
        data: {
          canManage,
          configured: true,
          broken: false,
          connection: { ...installation, repositories, viewer },
        },
      });
    } catch (error) {
      // Installation supprimée côté GitHub : l'espace reste lié mais inutilisable
      console.error("Lecture de l'installation GitHub impossible", error);
      return c.json({ data: { canManage, configured: true, broken: true, connection: null } });
    }
  });

export default app;
