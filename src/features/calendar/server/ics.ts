import "server-only";

import { Task } from "@/features/tasks/types";
import { Project } from "@/features/projects/types";
import { parseBoardColumns } from "@/features/projects/utils";
import { TASK_PRIORITY_CONFIG } from "@/features/tasks/constants";

import { isDoneStatus } from "@/features/tasks/server/done";

const dayFormatter = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris" });

const icsDay = (value: string, offsetDays = 0) => {
  const [year, month, day] = dayFormatter.format(new Date(value)).split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + offsetDays));
  return date.toISOString().slice(0, 10).replaceAll("-", "");
};

const icsTimestamp = (value: string) =>
  new Date(value)
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");

const escapeText = (value: string) =>
  value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

const fold = (line: string) => {
  const encoder = new TextEncoder();
  const parts: string[] = [];
  let current = "";
  let size = 0;

  for (const char of line) {
    const length = encoder.encode(char).length;
    if (size + length > (parts.length === 0 ? 75 : 74)) {
      parts.push(current);
      current = "";
      size = 0;
    }
    current += char;
    size += length;
  }
  parts.push(current);

  return parts.join("\r\n ");
};

interface BuildCalendarOptions {
  name: string;
  appUrl: string;
  tasks: Task[];
  projects: Map<string, Project>;
}

export const buildCalendar = ({ name, appUrl, tasks, projects }: BuildCalendarOptions) => {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Boardify//Tâches//FR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeText(name)}`,
    "X-WR-TIMEZONE:Europe/Paris",
    "REFRESH-INTERVAL;VALUE=DURATION:PT1H",
    "X-PUBLISHED-TTL:PT1H",
  ];

  for (const task of tasks) {
    if (!task.dueDate) continue;

    const project = projects.get(task.projectId);
    const done = isDoneStatus(project, task.status);
    const column = parseBoardColumns(project?.columnConfig).find(
      (entry) => entry.id === task.status,
    );
    const url = `${appUrl}/workspaces/${task.workspaceId}/tasks/${task.$id}`;
    const start = task.startDate && task.startDate < task.dueDate ? task.startDate : task.dueDate;
    const details = [
      project && `Projet : ${project.name}`,
      `Statut : ${column?.label ?? task.status}`,
      task.priority && `Priorité : ${TASK_PRIORITY_CONFIG[task.priority]?.label ?? task.priority}`,
      task.estimate != null && `Estimation : ${task.estimate} pts`,
      task.description && `\n${task.description}`,
      `\n${url}`,
    ].filter(Boolean);

    lines.push(
      "BEGIN:VEVENT",
      `UID:${task.$id}@boardify`,
      `DTSTAMP:${icsTimestamp(task.$updatedAt)}`,
      `LAST-MODIFIED:${icsTimestamp(task.$updatedAt)}`,
      `DTSTART;VALUE=DATE:${icsDay(start)}`,
      `DTEND;VALUE=DATE:${icsDay(task.dueDate, 1)}`,
      `SUMMARY:${escapeText(`${done ? "✓ " : ""}${task.name}`)}`,
      `DESCRIPTION:${escapeText(details.join("\n"))}`,
      `URL:${url}`,
      ...(project ? [`CATEGORIES:${escapeText(project.name)}`] : []),
      "TRANSP:TRANSPARENT",
      "END:VEVENT",
    );
  }

  lines.push("END:VCALENDAR");

  return lines.map(fold).join("\r\n") + "\r\n";
};
