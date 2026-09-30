import {
  AlertCircleIcon,
  CheckCircle2Icon,
  CircleDotIcon,
  ListTodoIcon,
  UserCheckIcon,
} from "lucide-react";

import { ProjectAnalyticsResponseType } from "@/features/projects/api/use-get-project-analytics";

import { AnalyticsCard } from "./analytics-card";

export const Analytics = ({ data }: ProjectAnalyticsResponseType) => {
  return (
    <div className="hide-scrollbar -mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
      <div className="flex gap-3">
        <AnalyticsCard
          title="Tâches"
          icon={ListTodoIcon}
          value={data.taskCount}
          variant={data.taskDifference > 0 ? "up" : "down"}
          increaseValue={data.taskDifference}
        />
        <AnalyticsCard
          title="Assignées"
          icon={UserCheckIcon}
          value={data.assignedTaskCount}
          variant={data.assignedTaskDifference > 0 ? "up" : "down"}
          increaseValue={data.assignedTaskDifference}
        />
        <AnalyticsCard
          title="Terminées"
          icon={CheckCircle2Icon}
          value={data.completedTaskCount}
          variant={data.completedTaskDifference > 0 ? "up" : "down"}
          increaseValue={data.completedTaskDifference}
        />
        <AnalyticsCard
          title="En retard"
          icon={AlertCircleIcon}
          inverse
          value={data.overdueTaskCount}
          variant={data.overdueTaskDifference > 0 ? "up" : "down"}
          increaseValue={data.overdueTaskDifference}
        />
        <AnalyticsCard
          title="En cours"
          icon={CircleDotIcon}
          value={data.incompleteTaskCount}
          variant={data.incompleteTaskDifference > 0 ? "up" : "down"}
          increaseValue={data.incompleteTaskDifference}
        />
      </div>
    </div>
  );
};
