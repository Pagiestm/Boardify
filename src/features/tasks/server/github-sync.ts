import "server-only";

import { Label, LabelColor } from "@/features/labels/types";
import { Member } from "@/features/members/types";
import { Project } from "@/features/projects/types";
import { parseBoardColumns } from "@/features/projects/utils";
import { resolveGithubAccount } from "@/features/github/server/accounts";

import { getUserIdentity } from "@/lib/users";
import {
  createGithubIssue,
  editGithubIssueMetadata,
  ensureGithubLabels,
  getGithubIssueRepo,
  getGithubMilestone,
  isGithubAssignable,
  updateGithubIssue,
} from "@/lib/github";
import type { Collection, Db, Where } from "@/lib/db";

import { Task, TaskPriority } from "../types";
import { isDoneStatus } from "./done";

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "long",
  timeZone: "Europe/Paris",
});

const formatDate = (value?: string) => (value ? dateFormatter.format(new Date(value)) : null);

const dayFormatter = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris" });

const findStatusColumn = (project: Project | undefined, status: string) =>
  parseBoardColumns(project?.columnConfig).find((column) => column.id === status);

const LABEL_HEX: Record<LabelColor, string> = {
  teal: "14b8a6",
  blue: "3b82f6",
  amber: "f59e0b",
  violet: "8b5cf6",
  green: "22c55e",
  rose: "f43f5e",
};

interface IssueContext {
  db: Db;
  installationId: string;
  projects: Map<string, Project>;
  assignees: Map<string, { name: string; githubLogin: string | null }>;
  labels: Map<string, Label>;
}

const listByIds = async <T extends Label | Member | Project>(
  collection: Collection<T>,
  ids: string[],
) =>
  ids.length > 0
    ? (await collection.list({ where: { $id: ids } as Where<T>, limit: 100 })).documents
    : [];

const loadIssueContext = async (
  db: Db,
  installationId: string,
  tasks: Task[],
): Promise<IssueContext> => {
  const unique = (values: (string | undefined)[]) => [
    ...new Set(values.filter((value): value is string => !!value)),
  ];

  const [projects, members, labels] = await Promise.all([
    listByIds(db.projects, unique(tasks.map((task) => task.projectId))),
    listByIds(db.members, unique(tasks.map((task) => task.assigneeId))),
    listByIds(db.labels, unique(tasks.flatMap((task) => task.labelIds ?? []))),
  ]);

  const assignees = await Promise.all(
    members.map(async (member) => {
      const [identity, account] = await Promise.all([
        getUserIdentity(member.userId),
        resolveGithubAccount(member.userId, installationId).catch((error) => {
          console.error("Compte GitHub du membre introuvable", error);
          return null;
        }),
      ]);

      return [member.$id, { name: identity.name, githubLogin: account?.login ?? null }] as const;
    }),
  );

  return {
    db,
    installationId,
    projects: new Map(projects.map((project) => [project.$id, project])),
    assignees: new Map(assignees),
    labels: new Map(labels.map((label) => [label.$id, label])),
  };
};

export const PRIORITY_LABELS: Record<TaskPriority, { name: string; color: string }> = {
  [TaskPriority.HIGH]: { name: "priorité : haute", color: "d73a4a" },
  [TaskPriority.MEDIUM]: { name: "priorité : moyenne", color: "fbca04" },
  [TaskPriority.LOW]: { name: "priorité : basse", color: "c5def5" },
};

const getManagedLabels = (task: Task, context: IssueContext) => [
  ...(task.labelIds ?? [])
    .map((labelId) => context.labels.get(labelId))
    .filter((label): label is Label => !!label)
    .map((label) => ({ name: label.name, color: LABEL_HEX[label.color] ?? "ededed" })),
  ...(PRIORITY_LABELS[task.priority] ? [PRIORITY_LABELS[task.priority]] : []),
];

const getAssignableLogin = async (task: Task, repo: string, context: IssueContext) => {
  const login = context.assignees.get(task.assigneeId)?.githubLogin;
  return login && (await isGithubAssignable(context.installationId, repo, login)) ? login : null;
};

const DETAILS_MARKER = "- **Statut** :";
const FOOTER_MARKER = "<sub>Synchronisée";

const MAX_DESCRIPTION_LENGTH = 2048;
const TRUNCATED_SUFFIX = "\n\n…";

const truncateDescription = (text: string) =>
  text.length > MAX_DESCRIPTION_LENGTH
    ? `${text.slice(0, MAX_DESCRIPTION_LENGTH - TRUNCATED_SUFFIX.length).trimEnd()}${TRUNCATED_SUFFIX}`
    : text;

export const extractTaskDescription = (body: string | null) => {
  const text = (body ?? "").replace(/\r\n/g, "\n");
  const end = Math.min(
    ...[DETAILS_MARKER, FOOTER_MARKER]
      .map((marker) => text.indexOf(marker))
      .filter((index) => index >= 0),
    text.length,
  );

  return truncateDescription(
    text
      .slice(0, end)
      .replace(/\n-{3,}\s*$/, "")
      .trim(),
  );
};

const buildIssueText = (task: Task, context: IssueContext, githubLogin: string | null) => {
  const project = context.projects.get(task.projectId);
  const assignee = context.assignees.get(task.assigneeId);
  const start = formatDate(task.startDate);
  const due = formatDate(task.dueDate);
  const taskUrl = `${process.env.NEXT_PUBLIC_APP_URL}/workspaces/${task.workspaceId}/tasks/${task.$id}`;

  const details = [
    `${DETAILS_MARKER} ${findStatusColumn(project, task.status)?.label ?? task.status}`,
    ...(githubLogin
      ? []
      : [`- **Assigné à** : ${assignee ? `${assignee.name} (sans compte GitHub lié)` : "—"}`]),
    `- **Période** : ${start && due && start !== due ? `${start} → ${due}` : (due ?? start ?? "—")}`,
  ].join("\n");

  const footer = `---\n\n${FOOTER_MARKER} avec [Boardify](${taskUrl}) : le statut et la période se modifient depuis Boardify.</sub>`;

  return {
    title: task.name,
    body: [task.description?.trim(), details, footer].filter(Boolean).join("\n\n"),
  };
};

const getProjectDueDay = async (db: Db, projectId: string) => {
  const { documents } = await db.tasks.list({
    where: { projectId },
    orderBy: { dueDate: "desc" },
    limit: 1,
  });
  const dueDate = documents[0]?.dueDate;

  return dueDate ? dayFormatter.format(new Date(dueDate)) : null;
};

const syncMilestone = async (project: Project, repo: string, context: IssueContext) => {
  try {
    const dueDay = await getProjectDueDay(context.db, project.$id);
    return await getGithubMilestone(context.installationId, repo, project.name, dueDay);
  } catch (error) {
    console.error("Milestone GitHub impossible", error);
    return undefined;
  }
};

const prepareRepository = async (task: Task, repo: string, context: IssueContext) => {
  const labels = getManagedLabels(task, context);
  const project = context.projects.get(task.projectId);

  const [milestone] = await Promise.all([
    project ? syncMilestone(project, repo, context) : undefined,
    ensureGithubLabels(context.installationId, repo, labels).catch((error) => {
      console.error("Création des labels GitHub impossible", error);
    }),
  ]);

  return { labels: labels.map((label) => label.name), milestone };
};

const getInstallationId = async (db: Db, workspaceId: string) => {
  const workspace = await db.workspaces.get(workspaceId);

  return workspace.githubInstallationId;
};

export const createTaskIssue = async (db: Db, task: Task) => {
  try {
    const [installationId, project] = await Promise.all([
      getInstallationId(db, task.workspaceId),
      db.projects.get(task.projectId),
    ]);
    if (!installationId || !project.githubRepo) return null;

    const context = await loadIssueContext(db, installationId, [task]);

    const repo = project.githubRepo;
    const [githubLogin, { labels, milestone }] = await Promise.all([
      getAssignableLogin(task, repo, context),
      prepareRepository(task, repo, context),
    ]);

    const githubIssueUrl = await createGithubIssue({
      installationId,
      repo,
      ...buildIssueText(task, context, githubLogin),
      labels,
      assignees: githubLogin ? [githubLogin] : [],
      milestone,
      state: isDoneStatus(project, task.status) ? "closed" : "open",
    });

    return await db.tasks.update(task.$id, { githubIssueUrl });
  } catch (error) {
    console.error("Création de l'issue GitHub impossible", error);
    return null;
  }
};

export const syncTaskIssues = async (
  db: Db,
  workspaceId: string,
  changes: { before: Task; after: Task }[],
  { syncState = true }: { syncState?: boolean } = {},
) => {
  const linked = changes.filter(({ after }) => after.githubIssueUrl);
  if (linked.length === 0) return;

  try {
    const installationId = await getInstallationId(db, workspaceId);
    if (!installationId) return;

    const context = await loadIssueContext(
      db,
      installationId,
      linked.flatMap(({ before, after }) => [before, after]),
    );

    const results = await Promise.allSettled(
      linked.map(async ({ before, after }) => {
        const issueUrl = after.githubIssueUrl!;
        const repo = getGithubIssueRepo(issueUrl);
        if (!repo) return;

        const wasDone = isDoneStatus(context.projects.get(before.projectId), before.status);
        const isDone = isDoneStatus(context.projects.get(after.projectId), after.status);

        const [githubLogin, { labels, milestone }] = await Promise.all([
          getAssignableLogin(after, repo, context),
          prepareRepository(after, repo, context),
        ]);

        await updateGithubIssue(installationId, issueUrl, {
          ...buildIssueText(after, context, githubLogin),
          ...(milestone !== undefined && { milestone }),
          state: !syncState || wasDone === isDone ? undefined : isDone ? "closed" : "open",
        });

        const lowerCase = (names: string[]) => new Set(names.map((name) => name.toLowerCase()));
        const currentLabels = lowerCase(labels);
        const previousLogin = context.assignees.get(before.assigneeId)?.githubLogin;

        await editGithubIssueMetadata(installationId, issueUrl, {
          addLabels: labels,
          removeLabels: getManagedLabels(before, context)
            .map((label) => label.name)
            .filter((name) => !currentLabels.has(name.toLowerCase())),
          addAssignees: githubLogin ? [githubLogin] : [],
          removeAssignees:
            previousLogin && previousLogin.toLowerCase() !== githubLogin?.toLowerCase()
              ? [previousLogin]
              : [],
        });
      }),
    );

    for (const result of results) {
      if (result.status === "rejected") {
        console.error("Mise à jour de l'issue GitHub impossible", result.reason);
      }
    }
  } catch (error) {
    console.error("Synchronisation des issues GitHub impossible", error);
  }
};

export const closeDeletedTaskIssue = async (db: Db, task: Task) => {
  if (!task.githubIssueUrl) return;

  try {
    const installationId = await getInstallationId(db, task.workspaceId);
    if (!installationId) return;

    await updateGithubIssue(installationId, task.githubIssueUrl, {
      state: "closed",
      stateReason: "not_planned",
    });
  } catch (error) {
    console.error("Fermeture de l'issue GitHub impossible", error);
  }
};
