import { z } from "zod";
import { Hono } from "hono";
import { Databases, ID, Query } from "node-appwrite";
import { zValidator } from "@hono/zod-validator";

import { getMember } from "@/features/members/utils";

import { DATABASE_ID, IMAGES_BUCKET_ID, PROJECTS_ID, TASKS_ID } from "@/config";
import { sessionMiddleware } from "@/lib/session-middleware";

import { createProjectSchema, updateBoardColumnsSchema, updateProjectSchema } from "../schemas";

import { Project } from "../types";

const deleteProjectTasks = async (databases: Databases, projectId: string): Promise<void> => {
  let cursor: string | undefined;

  do {
    const queries = [Query.equal("projectId", projectId), Query.limit(100)];
    if (cursor) queries.push(Query.cursorAfter(cursor));

    const { documents } = await databases.listDocuments(DATABASE_ID, TASKS_ID, queries);
    if (documents.length === 0) break;

    await Promise.all(
      documents.map((document) => databases.deleteDocument(DATABASE_ID, TASKS_ID, document.$id)),
    );

    cursor = documents.length === 100 ? documents[documents.length - 1].$id : undefined;
  } while (cursor);
};

const app = new Hono()
  .post("/", sessionMiddleware, zValidator("form", createProjectSchema), async (c) => {
    const databases = c.get("databases");
    const storage = c.get("storage");
    const user = c.get("user");

    const { name, image, workspaceId } = c.req.valid("form");

    const member = await getMember({
      databases,
      workspaceId,
      userId: user.$id,
    });

    if (!member) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    let uploadedImageUrl: string | undefined;

    if (image instanceof File) {
      const file = await storage.createFile(IMAGES_BUCKET_ID, ID.unique(), image);

      const arrayBuffer = await storage.getFilePreview(IMAGES_BUCKET_ID, file.$id);

      uploadedImageUrl = `data:image/png;base64,${Buffer.from(arrayBuffer).toString("base64")}`;
    }

    const project = await databases.createDocument(DATABASE_ID, PROJECTS_ID, ID.unique(), {
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
      const databases = c.get("databases");

      const { workspaceId } = c.req.valid("query");

      if (!workspaceId) {
        return c.json({ error: "Missing workspaceId" }, 400);
      }

      const member = await getMember({
        databases,
        workspaceId,
        userId: user.$id,
      });

      if (!member) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const projects = await databases.listDocuments<Project>(DATABASE_ID, PROJECTS_ID, [
        Query.equal("workspaceId", workspaceId),
        Query.orderDesc("$createdAt"),
      ]);

      return c.json({ data: projects });
    },
  )
  .get("/:projectId", sessionMiddleware, async (c) => {
    const user = c.get("user");
    const databases = c.get("databases");
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

    return c.json({ data: project });
  })
  .patch("/:projectId", sessionMiddleware, zValidator("form", updateProjectSchema), async (c) => {
    const databases = c.get("databases");
    const storage = c.get("storage");
    const user = c.get("user");

    const { projectId } = c.req.param();
    const { name, image } = c.req.valid("form");

    const existingProject = await databases.getDocument<Project>(
      DATABASE_ID,
      PROJECTS_ID,
      projectId,
    );

    const member = await getMember({
      databases,
      workspaceId: existingProject.workspaceId,
      userId: user.$id,
    });

    if (!member) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    let uploadedImageUrl: string | undefined;

    if (image instanceof File) {
      const file = await storage.createFile(IMAGES_BUCKET_ID, ID.unique(), image);

      const arrayBuffer = await storage.getFilePreview(IMAGES_BUCKET_ID, file.$id);

      uploadedImageUrl = `data:image/png;base64,${Buffer.from(arrayBuffer).toString("base64")}`;
    } else {
      uploadedImageUrl = image;
    }

    const project = await databases.updateDocument(DATABASE_ID, PROJECTS_ID, projectId, {
      name,
      imageUrl: uploadedImageUrl,
    });

    return c.json({ data: project });
  })
  .patch(
    "/:projectId/columns",
    sessionMiddleware,
    zValidator("json", updateBoardColumnsSchema),
    async (c) => {
      const databases = c.get("databases");
      const user = c.get("user");

      const { projectId } = c.req.param();
      const { columnConfig } = c.req.valid("json");

      const existingProject = await databases.getDocument<Project>(
        DATABASE_ID,
        PROJECTS_ID,
        projectId,
      );

      const member = await getMember({
        databases,
        workspaceId: existingProject.workspaceId,
        userId: user.$id,
      });

      if (!member) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const project = await databases.updateDocument<Project>(DATABASE_ID, PROJECTS_ID, projectId, {
        columnConfig,
      });

      return c.json({ data: project });
    },
  )
  .delete("/:projectId", sessionMiddleware, async (c) => {
    const databases = c.get("databases");
    const user = c.get("user");

    const { projectId } = c.req.param();

    const existingProject = await databases.getDocument<Project>(
      DATABASE_ID,
      PROJECTS_ID,
      projectId,
    );

    const member = await getMember({
      databases,
      workspaceId: existingProject.workspaceId,
      userId: user.$id,
    });

    if (!member) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    await deleteProjectTasks(databases, projectId);

    await databases.deleteDocument(DATABASE_ID, PROJECTS_ID, projectId);

    return c.json({ data: { $id: existingProject.$id } });
  });
export default app;
