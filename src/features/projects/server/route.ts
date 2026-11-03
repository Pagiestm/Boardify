import { z } from "zod";
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";

import { getMember } from "@/features/members/utils";

import { imageDataUrl } from "@/lib/files";
import { sessionMiddleware } from "@/lib/session-middleware";

import { createProjectSchema, updateBoardColumnsSchema, updateProjectSchema } from "../schemas";

import { deleteProject } from "./cleanup";

const app = new Hono()
  .post("/", sessionMiddleware, zValidator("form", createProjectSchema), async (c) => {
    const db = c.get("db");
    const user = c.get("user");

    const { name, image, workspaceId } = c.req.valid("form");

    const member = await getMember({
      db,
      workspaceId,
      userId: user.$id,
    });

    if (!member) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    let uploadedImageUrl: string | undefined;

    if (image instanceof File) {
      uploadedImageUrl = await imageDataUrl(image);
    }

    const project = await db.projects.create({
      name,
      imageUrl: uploadedImageUrl,
      workspaceId,
    });

    return c.json({ data: project });
  })
  .get(
    "/",
    sessionMiddleware,
    zValidator("query", z.object({ workspaceId: z.string() })),
    async (c) => {
      const user = c.get("user");
      const db = c.get("db");

      const { workspaceId } = c.req.valid("query");

      if (!workspaceId) {
        return c.json({ error: "Missing workspaceId" }, 400);
      }

      const member = await getMember({
        db,
        workspaceId,
        userId: user.$id,
      });

      if (!member) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const projects = await db.projects.list({
        where: { workspaceId },
        orderBy: { $createdAt: "desc" },
      });

      return c.json({ data: projects });
    },
  )
  .get("/:projectId", sessionMiddleware, async (c) => {
    const user = c.get("user");
    const db = c.get("db");
    const { projectId } = c.req.param();

    const project = await db.projects.get(projectId);

    const member = await getMember({
      db,
      workspaceId: project.workspaceId,
      userId: user.$id,
    });

    if (!member) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    return c.json({ data: project });
  })
  .patch("/:projectId", sessionMiddleware, zValidator("form", updateProjectSchema), async (c) => {
    const db = c.get("db");
    const user = c.get("user");

    const { projectId } = c.req.param();
    const { name, image, githubRepo } = c.req.valid("form");

    const existingProject = await db.projects.get(projectId);

    const member = await getMember({
      db,
      workspaceId: existingProject.workspaceId,
      userId: user.$id,
    });

    if (!member) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    let uploadedImageUrl: string | undefined;

    if (image instanceof File) {
      uploadedImageUrl = await imageDataUrl(image);
    } else {
      uploadedImageUrl = image;
    }

    const nextGithubRepo = githubRepo === undefined ? undefined : githubRepo || null;
    const githubRepoChanged =
      nextGithubRepo !== undefined && nextGithubRepo !== (existingProject.githubRepo ?? null);

    const project = await db.projects.update(projectId, {
      name,
      imageUrl: uploadedImageUrl,
      // null retire le dépôt lié.
      ...(githubRepoChanged && { githubRepo: nextGithubRepo }),
    });

    return c.json({ data: project });
  })
  .patch(
    "/:projectId/columns",
    sessionMiddleware,
    zValidator("json", updateBoardColumnsSchema),
    async (c) => {
      const db = c.get("db");
      const user = c.get("user");

      const { projectId } = c.req.param();
      const { columnConfig } = c.req.valid("json");

      const existingProject = await db.projects.get(projectId);

      const member = await getMember({
        db,
        workspaceId: existingProject.workspaceId,
        userId: user.$id,
      });

      if (!member) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const project = await db.projects.update(projectId, { columnConfig });

      return c.json({ data: project });
    },
  )
  .delete("/:projectId", sessionMiddleware, async (c) => {
    const db = c.get("db");
    const user = c.get("user");

    const { projectId } = c.req.param();

    const existingProject = await db.projects.get(projectId);

    const member = await getMember({
      db,
      workspaceId: existingProject.workspaceId,
      userId: user.$id,
    });

    if (!member) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    await deleteProject(db, c.get("files"), projectId);

    return c.json({ data: { $id: existingProject.$id } });
  });
export default app;
