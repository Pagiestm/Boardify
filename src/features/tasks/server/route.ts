import { z } from "zod";
import { Hono } from "hono";
import { ID, Query } from "node-appwrite";
import { zValidator } from "@hono/zod-validator";

import { getMember } from "@/features/members/utils";
import { Label } from "@/features/labels/types";
import { parseBoardColumns } from "@/features/projects/utils";
import { Member } from "@/features/members/types";
import { Project } from "@/features/projects/types";

import { createAdminClient } from "@/lib/appwrite";
import { getUserIdentities, getUserIdentity } from "@/lib/users";
import { sessionMiddleware } from "@/lib/session-middleware";
import { DATABASE_ID, LABELS_ID, MEMBERS_ID, PROJECTS_ID, TASKS_ID } from "@/config";

import { Task, TaskPriority } from "../types";
import { createtaskSchema } from "../schemas";
import { ActivityType } from "@/features/activities/types";
import { NotificationType } from "@/features/notifications/types";
import { notifyMembers } from "@/features/notifications/server/notify";
import { describeTaskChanges, logActivities } from "@/features/activities/server/activities";

import { deleteTaskRelations } from "./cleanup";
import { closeDeletedTaskIssue, createTaskIssue, syncTaskIssues } from "./github-sync";

const app = new Hono()
  .delete("/:taskId", sessionMiddleware, async (c) => {
    const user = c.get("user");
    const databases = c.get("databases");
    const { taskId } = c.req.param();

    const task = await databases.getDocument<Task>(DATABASE_ID, TASKS_ID, taskId);

    const member = await getMember({
      databases,
      workspaceId: task.workspaceId,
      userId: user.$id,
    });

    if (!member) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    await databases.deleteDocument(DATABASE_ID, TASKS_ID, taskId);
    await Promise.all([
      closeDeletedTaskIssue(databases, task),
      deleteTaskRelations(databases, taskId),
    ]);

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
      }),
    ),
    async (c) => {
      const { users } = await createAdminClient();
      const databases = c.get("databases");
      const user = c.get("user");

      const { workspaceId, projectId, status, search, assigneeId, dueDate, priority, labelId } =
        c.req.valid("query");

      const member = await getMember({
        databases,
        workspaceId,
        userId: user.$id,
      });

      if (!member) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const query = [Query.equal("workspaceId", workspaceId)];

      if (projectId) {
        query.push(Query.equal("projectId", projectId));
      }

      if (status) {
        query.push(Query.equal("status", status));
      }

      if (assigneeId) {
        query.push(Query.equal("assigneeId", assigneeId));
      }

      if (dueDate) {
        query.push(Query.equal("dueDate", dueDate));
      }

      if (priority) {
        query.push(Query.equal("priority", priority));
      }

      if (labelId) {
        query.push(Query.contains("labelIds", labelId));
      }

      if (search) {
        query.push(Query.contains("name", search));
      }

      const tasks = await databases.listDocuments<Task>(DATABASE_ID, TASKS_ID, query);

      const projectIds = tasks.documents.map((task) => task.projectId);
      const assigneeIds = tasks.documents.map((task) => task.assigneeId);

      const [projects, members, workspaceLabels] = await Promise.all([
        databases.listDocuments<Project>(
          DATABASE_ID,
          PROJECTS_ID,
          projectIds.length > 0 ? [Query.contains("$id", projectIds)] : [],
        ),
        databases.listDocuments<Member>(
          DATABASE_ID,
          MEMBERS_ID,
          assigneeIds.length > 0 ? [Query.contains("$id", assigneeIds)] : [],
        ),
        databases.listDocuments<Label>(DATABASE_ID, LABELS_ID, [
          Query.equal("workspaceId", workspaceId),
          Query.limit(100),
        ]),
      ]);

      const identities = await getUserIdentities(
        users,
        members.documents.map((member) => member.userId),
      );

      const assignees = members.documents.map((member) => ({
        ...member,
        name: identities.get(member.userId)?.name ?? "",
        email: identities.get(member.userId)?.email ?? "",
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

        return {
          ...task,
          project,
          assignee,
          labels,
          statusColumn,
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
    const databases = c.get("databases");
    const {
      name,
      status,
      workspaceId,
      projectId,
      dueDate,
      startDate,
      assigneeId,
      priority,
      description,
      labelIds,
    } = c.req.valid("json");

    const member = await getMember({
      databases,
      workspaceId,
      userId: user.$id,
    });

    if (!member) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const highestPositionTask = await databases.listDocuments(DATABASE_ID, TASKS_ID, [
      Query.equal("status", status),
      Query.equal("workspaceId", workspaceId),
      Query.orderAsc("position"),
      Query.limit(1),
    ]);

    const newPosition =
      highestPositionTask.documents.length > 0
        ? highestPositionTask.documents[0].position + 1000
        : 1000;

    const task = await databases.createDocument<Task>(DATABASE_ID, TASKS_ID, ID.unique(), {
      name,
      status,
      workspaceId,
      projectId,
      dueDate: dueDate.toISOString(),
      startDate: startDate.toISOString(),
      assigneeId,
      priority,
      description,
      labelIds: labelIds ?? [],
      position: newPosition,
    });

    const [linkedTask] = await Promise.all([
      createTaskIssue(databases, task),
      logActivities(databases, task, member.$id, [{ type: ActivityType.CREATED }]),
      notifyMembers(databases, {
        workspaceId,
        taskId: task.$id,
        type: NotificationType.ASSIGNED,
        actorId: member.$id,
        recipientIds: [assigneeId],
      }),
    ]);

    return c.json({ data: linkedTask ?? task });
  })
  .patch(
    "/:taskId",
    sessionMiddleware,
    zValidator("json", createtaskSchema.partial()),
    async (c) => {
      const user = c.get("user");
      const databases = c.get("databases");
      const {
        name,
        status,
        description,
        projectId,
        dueDate,
        startDate,
        assigneeId,
        priority,
        labelIds,
      } = c.req.valid("json");
      const { taskId } = c.req.param();

      const existingTask = await databases.getDocument<Task>(DATABASE_ID, TASKS_ID, taskId);

      const member = await getMember({
        databases,
        workspaceId: existingTask.workspaceId,
        userId: user.$id,
      });

      if (!member) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const task = await databases.updateDocument<Task>(DATABASE_ID, TASKS_ID, taskId, {
        name,
        status,
        projectId,
        dueDate: dueDate instanceof Date ? dueDate.toISOString() : dueDate,
        startDate: startDate instanceof Date ? startDate.toISOString() : startDate,
        assigneeId,
        priority,
        description,
        labelIds,
      });

      await Promise.all([
        syncTaskIssues(databases, existingTask.workspaceId, [
          { before: existingTask, after: task },
        ]),
        logActivities(databases, task, member.$id, describeTaskChanges(existingTask, task)),
        existingTask.assigneeId !== task.assigneeId &&
          notifyMembers(databases, {
            workspaceId: task.workspaceId,
            taskId: task.$id,
            type: NotificationType.ASSIGNED,
            actorId: member.$id,
            recipientIds: [task.assigneeId],
          }),
      ]);

      return c.json({ data: task });
    },
  )
  .get("/:taskId", sessionMiddleware, async (c) => {
    const currentUser = c.get("user");
    const databases = c.get("databases");
    const { users } = await createAdminClient();
    const { taskId } = c.req.param();

    const task = await databases.getDocument<Task>(DATABASE_ID, TASKS_ID, taskId);

    const currentMember = await getMember({
      databases,
      workspaceId: task.workspaceId,
      userId: currentUser.$id,
    });

    if (!currentMember) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const labelIds = task.labelIds ?? [];

    const [project, member, labels] = await Promise.all([
      databases.getDocument<Project>(DATABASE_ID, PROJECTS_ID, task.projectId),
      databases.getDocument<Member>(DATABASE_ID, MEMBERS_ID, task.assigneeId),
      labelIds.length > 0
        ? databases
            .listDocuments<Label>(DATABASE_ID, LABELS_ID, [
              Query.equal("$id", labelIds),
              Query.limit(100),
            ])
            .then((response) => response.documents)
        : Promise.resolve([]),
    ]);

    const assignee = {
      ...member,
      ...(await getUserIdentity(users, member.userId)),
    };

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
      },
    });
  })
  .post(
    "/bulk-update",
    sessionMiddleware,
    zValidator(
      "json",
      z.object({
        tasks: z.array(
          z.object({
            $id: z.string(),
            status: z.string().max(50),
            position: z.number().int().positive().min(1000).max(1_000_000),
          }),
        ),
      }),
    ),
    async (c) => {
      const databases = c.get("databases");
      const user = c.get("user");
      const { tasks } = await c.req.valid("json");

      const tasksToUpdate = await databases.listDocuments<Task>(DATABASE_ID, TASKS_ID, [
        Query.contains(
          "$id",
          tasks.map((task) => task.$id),
        ),
      ]);

      const workspaceIds = new Set(tasksToUpdate.documents.map((task) => task.workspaceId));
      if (workspaceIds.size !== 1) {
        return c.json({ error: "All tasks must belong to the same workspace" }, 400);
      }

      const workspaceId = [...workspaceIds][0];

      const member = await getMember({
        databases,
        workspaceId,
        userId: user.$id,
      });

      if (!member) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const updatedTasks = await Promise.all(
        tasks.map(async (task) => {
          const { $id, status, position } = task;
          return databases.updateDocument<Task>(DATABASE_ID, TASKS_ID, $id, { status, position });
        }),
      );

      const tasksBefore = new Map(tasksToUpdate.documents.map((task) => [task.$id, task]));
      const statusChanges = updatedTasks
        .map((after) => ({ before: tasksBefore.get(after.$id)!, after }))
        .filter(({ before, after }) => before && before.status !== after.status);

      await Promise.all([
        syncTaskIssues(databases, workspaceId, statusChanges),
        ...statusChanges.map(({ before, after }) =>
          logActivities(databases, after, member.$id, describeTaskChanges(before, after)),
        ),
      ]);

      return c.json({ data: updatedTasks });
    },
  );

export default app;
