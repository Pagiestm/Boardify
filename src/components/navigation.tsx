"use client"

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HomeIcon, ListChecksIcon, SettingsIcon, UsersIcon } from "lucide-react";

import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";

import { cn } from "@/lib/utils";

const routes = [
    { label: "Accueil", href: "", icon: HomeIcon },
    { label: "Mes tâches", href: "/tasks", icon: ListChecksIcon },
    { label: "Paramètres", href: "/settings", icon: SettingsIcon },
    { label: "Membres", href: "/members", icon: UsersIcon },
]

export const Navigation = () => {
    const workspaceId = useWorkspaceId()
    const pathname = usePathname()

    return (
        <nav>
            <ul className="flex flex-col gap-0.5">
                {routes.map(({ label, href, icon: Icon }) => {
                    const fullHref = `/workspaces/${workspaceId}${href}`
                    const isActive = pathname === fullHref

                    return (
                        <li key={href}>
                            <Link
                                href={fullHref}
                                aria-current={isActive ? "page" : undefined}
                                className={cn(
                                    "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors",
                                    isActive
                                        ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                                        : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                                )}
                            >
                                <Icon className={cn("size-4", isActive && "text-primary")} />
                                {label}
                            </Link>
                        </li>
                    )
                })}
            </ul>
        </nav>
    )
}
