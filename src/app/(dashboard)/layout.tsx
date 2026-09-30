import { EditTaskModal } from "@/features/tasks/components/edit-task-modal";
import { CreateTaskModal } from "@/features/tasks/components/create-task-modal";
import { CreateProjectModal } from "@/features/projects/components/create-project-modal";
import { CreateWorkspaceModal } from "@/features/workspaces/components/create-workspace-modal";

import { Navbar } from "@/components/navbar";
import { Sidebar } from "@/components/sidebar";
import { ShortcutsHelp } from "@/components/shortcuts-help";
import { CommandPalette, GlobalHotkeys } from "@/components/command-palette";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  return (
    <div className="min-h-screen bg-background">
      <CreateWorkspaceModal />
      <CreateProjectModal />
      <CreateTaskModal />
      <EditTaskModal />
      <CommandPalette />
      <ShortcutsHelp />
      <GlobalHotkeys />
      <div className="fixed inset-y-0 left-0 hidden w-64 lg:block">
        <Sidebar />
      </div>
      <div className="flex min-h-screen flex-col lg:pl-64">
        <Navbar />
        <main className="mx-auto flex w-full max-w-screen-2xl flex-1 flex-col px-4 py-6 md:px-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
