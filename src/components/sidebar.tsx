import { Logo } from "@/components/brand/logo";

import { Projects } from "./projects";
import { Navigation } from "./navigation";
import { SidebarSearch } from "./command-palette";
import { WorkspaceSwitcher } from "./workspace-switcher";

export const Sidebar = () => {
  return (
    <aside className="flex h-full w-full flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      <div className="flex h-14 shrink-0 items-center px-4">
        <Logo href="/dashboard" />
      </div>
      <div className="hide-scrollbar flex flex-1 flex-col gap-6 overflow-y-auto px-3 pb-4">
        <WorkspaceSwitcher />
        <Navigation />
        <Projects />
      </div>
      <SidebarSearch />
    </aside>
  );
};
