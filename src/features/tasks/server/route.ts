import { z } from "zod";
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";

import { getMember } from "@/features/members/utils";
import { Label } from "@/features/labels/types";
import { parseBoardColumns } from "@/features/projects/utils";

import { getUserIdentities, getUserIdentity } from "@/lib/users";
import { sessionMiddleware } from "@/lib/session-middleware";

import type { Where } from "@/lib/db";

import { Task, TaskPriority } from "../types";
import { createtaskSchema } from "../schemas";
import { describeTaskChanges, logActivities } from "@/features/activities/server/activities";

import { listChecklistItems } from "@/features/checklist/server/items";
import { NO_SPRINT } from "@/features/sprints/types";

import { createNextOccurrence } from "./recurrence";
import { getBlockerStates } from "./dependencies";
import { syncTaskIssues } from "./github-sync";
import { createTask, deleteTask, updateTask } from "./mutations";

/** Une colonne Kanban peut compter jusqu'à 1 000 tâches (positions de 1 000 à 1 000 000). */
const BULK_UPDATE_LIMIT = 1000;
/** Nombre d'identifiants par requête (Appwrite en accepte 100 au plus). */
const ID_BATCH = 100;

const app = new Hono()
  .delete("/:taskId", sessionMiddleware, async (c) => {
    const user = c.get("user");
    const db = c.get("db");
    const { taskId } = c.req.param();

    const task = await db.tasks.get(taskId);

    const member = await getMember({
      db,
      workspaceId: task.workspaceId,
      userId: user.$id,
    });

    if (!member) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    await deleteTask(db, c.get("files"), task);

    return c.json({ data: { $id: task.$id } });
  })
  .get(
    "/",
    sessionMiddleware,
    zValidator(
      "query",
      z.object({
        workspaceId: z.string(),
        projectId: z.string().nullish(),
        assigneeId: z.string().nullish(),
        status: z.string().nullish(),
        search: z.string().nullish(),
        labelId: z.string().nullish(),
        dueDate: z.string().nullish(),
        priority: z.nativeEnum(TaskPriority).nullish(),
        sprintId: z.string().nullish(),
      }),
    ),
    async (c) => {
      const db = c.get("db");
      const user = c.get("user");

      const {
        workspaceId,
        projectId,
        status,
        search,
        assigneeId,
        dueDate,
        priority,
        labelId,
        sprintId,
      } = c.req.valid("query");

      const member = await getMember({
        db,
        workspaceId,
        userId: user.$id,
      });

      if (!member) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const where: Where<Task> = { workspaceId };

      if (projectId) {
        where.projectId = projectId;
      }

      if (status) {
        where.status = status;
      }

      if (assigneeId) {
        where.assigneeId = assigneeId;
      }

      if (dueDate) {
        where.dueDate = dueDate;
      }

      if (priority) {
        where.priority = priority;
      }

      if (labelId) {
        where.labelIds = { has: labelId };
      }

      if (search) {
        where.name = { search };
      }

      if (sprintId) {
        where.sprintId = sprintId === NO_SPRINT ? null : sprintId;
      }

      const tasks = await db.tasks.list({ where, limit: 5000 });

      // Projets et membres de l'espace en une requête chacun, quel que soit le nombre de tâches.
      const [projects, members, workspaceLabels, checklistItems, blockerStates] = await Promise.all(
        [
          db.projects.list({ where: { workspaceId }, limit: 500 }),
          db.members.list({ where: { workspaceId }, limit: 500 }),
          db.labels.list({ where: { workspaceId }, limit: 100 }),
          listChecklistItems(
            db,
            tasks.documents.map((task) => task.$id),
          ),
          getBlockerStates(db, tasks.documents),
        ],
      );

      const identities = await getUserIdentities(members.documents.map((member) => member.userId));

      const assignees = members.documents.map((member) => ({
        ...member,
        name: identities.get(member.userId)?.name ?? "",
        email: identities.get(member.userId)?.email ?? "",
        avatarUrl: identities.get(member.userId)?.avatarUrl,
      }));

      const populatedTasks = tasks.documents.map((task) => {
        const project = projects.documents.find((project) => project.$id === task.projectId);
        const statusColumn = parseBoardColumns(project?.columnConfig).find(
          (column) => column.id === task.status,
        );
        const assignee = assignees.find((assignee) => assignee.$id === task.assigneeId);
        const labels = (task.labelIds ?? [])
          .map((labelId) => workspaceLabels.documents.find((label) => label.$id === labelId))
          .filter((label): label is Label => Boolean(label));

        const checklist = checklistItems.filter((item) => item.taskId === task.$id);

        return {
          ...task,
          project,
          assignee,
          labels,
          statusColumn,
          checklist: {
            total: checklist.length,
            done: checklist.filter((item) => item.done).length,
          },
          openBlockers: (task.blockedBy ?? []).filter(
            (blockerId) => blockerStates.get(blockerId)?.done === false,
          ).length,
        };
      });

      return c.json({
        data: {
          ...tasks,
          documents: populatedTasks,
        },
      });
    },
  )
  .post("/", sessionMiddleware, zValidator("json", createtaskSchema), async (c) => {
    const user = c.get("user");
    const db = c.get("db");
    const input = c.req.valid("json");

    const member = await getMember({
      db,
      workspaceId: input.workspaceId,
      userId: user.$id,
    });

    if (!member) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const result = await createTask(db, member.$id, input);
    if (result.error !== undefined) return c.json({ error: result.error }, 400);

    return c.json({ data: result.data });
  })
  .patch(
    "/:taskId",
    sessionMiddleware,
    zValidator("json", createtaskSchema.partial()),
    async (c) => {
      const user = c.get("user");
      const db = c.get("db");
      const input = c.req.valid("json");
      const { taskId } = c.req.param();

      const existingTask = await db.tasks.get(taskId);

      const member = await getMember({
        db,
        workspaceId: existingTask.workspaceId,
        userId: user.$id,
      });

      if (!member) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const result = await updateTask(db, member.$id, existingTask, input);
      if (result.error !== undefined) return c.json({ error: result.error }, 400);

      return c.json({ data: result.data });
    },
  )
  .get("/:taskId", sessionMiddleware, async (c) => {
    const currentUser = c.get("user");
    const db = c.get("db");
    const { taskId } = c.req.param();

    const task = await db.tasks.get(taskId);

    const currentMember = await getMember({
      db,
      workspaceId: task.workspaceId,
      userId: currentUser.$id,
    });

    if (!currentMember) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const labelIds = task.labelIds ?? [];

    const [project, member, labels] = await Promise.all([
      db.projects.get(task.projectId),
      db.members.get(task.assigneeId),
      labelIds.length > 0
        ? db.labels
            .list({ where: { $id: labelIds }, limit: 100 })
            .then((response) => response.documents)
        : Promise.resolve([]),
    ]);

    const assignee = {
      ...member,
      ...(await getUserIdentity(member.userId)),
    };

    const { documents: blockedTasks } = await db.tasks.list({
      where: { workspaceId: task.workspaceId, blockedBy: { has: [task.$id] } },
      limit: 100,
    });
    const states = await getBlockerStates(db, [task, ...blockedTasks]);

    const statusColumn = parseBoardColumns(project.columnConfig).find(
      (column) => column.id === task.status,
    );

    return c.json({
      data: {
        ...task,
        project,
        assignee,
        labels,
        statusColumn,
        blockers: (task.blockedBy ?? [])
          .map((blockerId) => states.get(blockerId))
          .filter((state) => !!state),
        blocking: blockedTasks.map((blocked) => states.get(blocked.$id)).filter((state) => !!state),
      },
    });
  })
  .post(
    "/bulk-update",
    sessionMiddleware,
    zValidator(
      "json",
      z.object({
        tasks: z
          .array(
            z.object({
              $id: z.string(),
              status: z.string().max(50),
              position: z.number().int().positive().min(1000).max(1_000_000),
            }),
          )
          .max(BULK_UPDATE_LIMIT),
      }),
    ),
    async (c) => {
      const db = c.get("db");
      const user = c.get("user");
      const { tasks } = await c.req.valid("json");

      // Toutes les tâches envoyées sont vérifiées : aucune ne doit manquer ni venir d'un autre espace.
      const ids = [...new Set(tasks.map((task) => task.$id))];
      const found: Task[] = [];
      for (let index = 0; index < ids.length; index += ID_BATCH) {
        const batch = ids.slice(index, index + ID_BATCH);
        found.push(
          ...(await db.tasks.list({ where: { $id: batch }, limit: batch.length })).documents,
        );
      }
      if (found.length !== ids.length) {
        return c.json({ error: "Task not found" }, 404);
      }

      const workspaceIds = new Set(found.map((task) => task.workspaceId));
      if (workspaceIds.size !== 1) {
        return c.json({ error: "All tasks must belong to the same workspace" }, 400);
      }

      const workspaceId = [...workspaceIds][0];

      const member = await getMember({
        db,
        workspaceId,
        userId: user.$id,
      });

      if (!member) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const updatedTasks = await Promise.all(
        tasks.map(async (task) => {
          const { $id, status, position } = task;
          return db.tasks.update($id, { status, position });
        }),
      );

      const tasksBefore = new Map(found.map((task) => [task.$id, task]));
      const statusChanges = updatedTasks
        .map((after) => ({ before: tasksBefore.get(after.$id)!, after }))
        .filter(({ before, after }) => before && before.status !== after.status);

      await Promise.all([
        syncTaskIssues(db, workspaceId, statusChanges),
        ...statusChanges.map(({ before, after }) =>
          logActivities(db, after, member.$id, describeTaskChanges(before, after)),
        ),
        ...statusChanges.map(({ before, after }) =>
          createNextOccurrence(db, before, after, member.$id),
        ),
      ]);

      return c.json({ data: updatedTasks });
    },
  );

export default app;
