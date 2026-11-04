import "server-only";

import type { Databases } from "node-appwrite";

import type { Task } from "@/features/tasks/types";
import type { Label } from "@/features/labels/types";
import type { Sprint } from "@/features/sprints/types";
import type { Member } from "@/features/members/types";
import type { Comment } from "@/features/comments/types";
import type { Project } from "@/features/projects/types";
import type { Activity } from "@/features/activities/types";
import type { SavedView } from "@/features/saved-views/types";
import type { Workspace } from "@/features/workspaces/types";
import type { TaskTemplate } from "@/features/templates/types";
import type { Attachment } from "@/features/attachments/types";
import type { ChecklistItem } from "@/features/checklist/types";
import type { PresenceRecord } from "@/features/presence/types";
import type { Notification } from "@/features/notifications/types";
import type { AiSettings } from "@/features/assistant/server/model";
import type { TimeEntry } from "@/features/time-tracking/types";
import type { Reminder } from "@/features/reminders/types";
import type { PokerSession, PokerVote } from "@/features/poker/types";
import type { ProjectDoc } from "@/features/docs/types";
import type { IntakeForm } from "@/features/intake/types";
import type { RetroItem } from "@/features/retro/types";

import {
  ACTIVITIES_ID,
  AI_SETTINGS_ID,
  ATTACHMENTS_ID,
  CHECKLIST_ITEMS_ID,
  DOCS_ID,
  INTAKE_FORMS_ID,
  POKER_SESSIONS_ID,
  POKER_VOTES_ID,
  REMINDERS_ID,
  RETRO_ITEMS_ID,
  TIME_ENTRIES_ID,
  COMMENTS_ID,
  DATABASE_ID,
  LABELS_ID,
  MEMBERS_ID,
  NOTIFICATIONS_ID,
  PRESENCE_ID,
  PROJECTS_ID,
  SAVED_VIEWS_ID,
  SPRINTS_ID,
  TASK_TEMPLATES_ID,
  TASKS_ID,
  WORKSPACES_ID,
} from "@/config";

import * as schema from "./schema";
import { appwriteCollection } from "./appwrite";
import { postgresCollection } from "./postgres";
import { DB_PROVIDER, getPostgres } from "./client";
import type { BaseDocument, Collection } from "./types";

export type { Collection, Where, ListOptions } from "./types";
export { isConflict, isNotFound } from "./errors";

/** Toutes les collections de Boardify, derrière le format d'accès neutre. */
export interface Db {
  workspaces: Collection<Workspace>;
  members: Collection<Member>;
  projects: Collection<Project>;
  tasks: Collection<Task>;
  labels: Collection<Label>;
  comments: Collection<Comment>;
  activities: Collection<Activity>;
  notifications: Collection<Notification>;
  checklistItems: Collection<ChecklistItem>;
  attachments: Collection<Attachment>;
  taskTemplates: Collection<TaskTemplate>;
  savedViews: Collection<SavedView>;
  /** Facultatives avec Appwrite : `enabled` vaut faux sans leur variable d'environnement. */
  sprints: Collection<Sprint>;
  aiSettings: Collection<AiSettings>;
  presence: Collection<PresenceRecord>;
  timeEntries: Collection<TimeEntry>;
  reminders: Collection<Reminder>;
  pokerSessions: Collection<PokerSession>;
  pokerVotes: Collection<PokerVote>;
  docs: Collection<ProjectDoc>;
  intakeForms: Collection<IntakeForm>;
  retroItems: Collection<RetroItem>;
}

const appwriteDb = (databases: Databases): Db => {
  const collection = <T extends BaseDocument>(id: string | undefined) =>
    appwriteCollection<T>(databases, DATABASE_ID, id);

  return {
    workspaces: collection<Workspace>(WORKSPACES_ID),
    members: collection<Member>(MEMBERS_ID),
    projects: collection<Project>(PROJECTS_ID),
    tasks: collection<Task>(TASKS_ID),
    labels: collection<Label>(LABELS_ID),
    comments: collection<Comment>(COMMENTS_ID),
    activities: collection<Activity>(ACTIVITIES_ID),
    notifications: collection<Notification>(NOTIFICATIONS_ID),
    checklistItems: collection<ChecklistItem>(CHECKLIST_ITEMS_ID),
    attachments: collection<Attachment>(ATTACHMENTS_ID),
    taskTemplates: collection<TaskTemplate>(TASK_TEMPLATES_ID),
    savedViews: collection<SavedView>(SAVED_VIEWS_ID),
    sprints: collection<Sprint>(SPRINTS_ID),
    aiSettings: collection<AiSettings>(AI_SETTINGS_ID),
    presence: collection<PresenceRecord>(PRESENCE_ID),
    timeEntries: collection<TimeEntry>(TIME_ENTRIES_ID),
    reminders: collection<Reminder>(REMINDERS_ID),
    pokerSessions: collection<PokerSession>(POKER_SESSIONS_ID),
    pokerVotes: collection<PokerVote>(POKER_VOTES_ID),
    docs: collection<ProjectDoc>(DOCS_ID),
    intakeForms: collection<IntakeForm>(INTAKE_FORMS_ID),
    retroItems: collection<RetroItem>(RETRO_ITEMS_ID),
  };
};

let postgresDb: Db | undefined;

/** Les mêmes collections sur Postgres : toutes les tables existent, donc toutes sont actives. */
const getPostgresDb = (): Db =>
  (postgresDb ??= {
    workspaces: postgresCollection<Workspace>(getPostgres, schema.workspaces),
    members: postgresCollection<Member>(getPostgres, schema.members),
    projects: postgresCollection<Project>(getPostgres, schema.projects),
    tasks: postgresCollection<Task>(getPostgres, schema.tasks),
    labels: postgresCollection<Label>(getPostgres, schema.labels),
    comments: postgresCollection<Comment>(getPostgres, schema.comments),
    activities: postgresCollection<Activity>(getPostgres, schema.activities),
    notifications: postgresCollection<Notification>(getPostgres, schema.notifications),
    checklistItems: postgresCollection<ChecklistItem>(getPostgres, schema.checklistItems),
    attachments: postgresCollection<Attachment>(getPostgres, schema.attachments),
    taskTemplates: postgresCollection<TaskTemplate>(getPostgres, schema.taskTemplates),
    savedViews: postgresCollection<SavedView>(getPostgres, schema.savedViews),
    sprints: postgresCollection<Sprint>(getPostgres, schema.sprints),
    aiSettings: postgresCollection<AiSettings>(getPostgres, schema.aiSettings),
    presence: postgresCollection<PresenceRecord>(getPostgres, schema.presence),
    timeEntries: postgresCollection<TimeEntry>(getPostgres, schema.timeEntries),
    reminders: postgresCollection<Reminder>(getPostgres, schema.reminders),
    pokerSessions: postgresCollection<PokerSession>(getPostgres, schema.pokerSessions),
    pokerVotes: postgresCollection<PokerVote>(getPostgres, schema.pokerVotes),
    docs: postgresCollection<ProjectDoc>(getPostgres, schema.docs),
    intakeForms: postgresCollection<IntakeForm>(getPostgres, schema.intakeForms),
    retroItems: postgresCollection<RetroItem>(getPostgres, schema.retroItems),
  });

/**
 * Accès aux données. Avec Appwrite, les requêtes passent par le client fourni (session de
 * l'utilisateur ou clé d'API) ; avec Postgres (`DB_PROVIDER=postgres`), il est ignoré.
 */
export const createDb = (databases: Databases): Db =>
  DB_PROVIDER === "postgres" ? getPostgresDb() : appwriteDb(databases);
