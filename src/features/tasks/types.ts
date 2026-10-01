import { Models } from "node-appwrite";

import type { Member } from "@/features/members/types";
import type { Project } from "@/features/projects/types";
import type { Label } from "@/features/labels/types";
import type { BoardColumn } from "@/features/projects/types";

export enum TaskStatus {
  BACKLOG = "BACKLOG",
  TODO = "TODO",
  IN_PROGRESS = "IN_PROGRESS",
  IN_REVIEW = "IN_REVIEW",
  DONE = "DONE",
}

export enum TaskPriority {
  HIGH = "HIGH",
  MEDIUM = "MEDIUM",
  LOW = "LOW",
}

export type Task = Models.Document & {
  name: string;
  status: string;
  workspaceId: string;
  assigneeId: string;
  projectId: string;
  position: number;
  dueDate: string;
  priority: TaskPriority;
  description?: string;
  labelIds?: string[];
};

export type PopulatedTask = Task & {
  project?: Project;
  assignee?: Member;
  labels?: Label[];
  statusColumn?: BoardColumn;
};
