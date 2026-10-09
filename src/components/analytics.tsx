import { ListTodoIcon, UserCheckIcon } from "lucide-react";

import { WorkspaceAnalyticsResponseType } from "@/features/workspaces/api/use-get-workspace-analytics";

import { AnalyticsCard } from "./analytics-card";

export const Analytics = ({ data }: WorkspaceAnalyticsResponseType) => {
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
      </div>
    </div>
  );
};
