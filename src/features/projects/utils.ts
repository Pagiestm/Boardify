import { TaskStatus } from "@/features/tasks/types";
import { TASK_STATUS_CONFIG, TASK_STATUS_ORDER } from "@/features/tasks/constants";

import { DEFAULT_COLUMN_COLORS } from "./constants";
import { BoardColumn, COLUMN_COLORS, ColumnColor } from "./types";

export const defaultBoardColumns = (): BoardColumn[] =>
  TASK_STATUS_ORDER.map((status) => ({
    id: status,
    label: TASK_STATUS_CONFIG[status].label,
    color: DEFAULT_COLUMN_COLORS[status],
    hidden: false,
    done: status === TaskStatus.DONE,
  }));

export const createColumnId = () =>
  `col_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

const isStatus = (value: unknown): value is TaskStatus =>
  typeof value === "string" && TASK_STATUS_ORDER.includes(value as TaskStatus);

const isColor = (value: unknown): value is ColumnColor =>
  typeof value === "string" && COLUMN_COLORS.includes(value as ColumnColor);

export const parseBoardColumns = (raw?: string | null): BoardColumn[] => {
  const defaults = defaultBoardColumns();
  if (!raw) return defaults;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return defaults;
  }

  if (!Array.isArray(parsed)) return defaults;

  const columns: BoardColumn[] = [];
  const seen = new Set<string>();

  for (const entry of parsed) {
    if (typeof entry !== "object" || entry === null) continue;
    const candidate = entry as Record<string, unknown>;

    const id =
      typeof candidate.id === "string" && candidate.id.trim().length > 0
        ? candidate.id.trim()
        : isStatus(candidate.status)
          ? candidate.status
          : null;
    if (!id || seen.has(id)) continue;

    const fallback = defaults.find((column) => column.id === id);

    seen.add(id);
    columns.push({
      id,
      label:
        typeof candidate.label === "string" && candidate.label.trim().length > 0
          ? candidate.label.trim().slice(0, 30)
          : (fallback?.label ?? "Colonne"),
      color: isColor(candidate.color) ? candidate.color : (fallback?.color ?? "zinc"),
      hidden: candidate.hidden === true,
      done: typeof candidate.done === "boolean" ? candidate.done : (fallback?.done ?? false),
    });
  }

  return columns.length > 0 ? columns : defaults;
};

export const serializeBoardColumns = (columns: BoardColumn[]) =>
  JSON.stringify(
    columns.map(({ id, label, color, hidden, done }) => ({ id, label, color, hidden, done })),
  );
