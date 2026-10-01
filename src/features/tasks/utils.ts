import { BoardColumn } from "@/features/projects/types";

import { TaskStatus } from "./types";

export const isTaskDone = (task: { status: string; statusColumn?: BoardColumn }) =>
  task.statusColumn ? task.statusColumn.done : task.status === TaskStatus.DONE;
