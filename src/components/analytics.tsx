import { ListTodoIcon, UserCheckIcon } from "lucide-react";

import { WorkspaceAnalyticsResponseType } from "@/features/workspaces/api/use-get-workspace-analytics";

import { AnalyticsCard } from "./analytics-card";

export const Analytics = ({ data }: WorkspaceAnalyticsResponseType) => {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
    </div>
  );
};
