"use client"

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SettingsIcon, UsersIcon } from "lucide-react";
import { GoCheckCircle, GoCheckCircleFill, GoHome, GoHomeFill } from "react-icons/go";

import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import { cn } from "@/lib/utils";

const routes = [
    {
        label: "Accueil",
        href: "",
        icon: GoHome,
        activeIcon: GoHomeFill,
    },
    {
        label: "Mes Tâches",
        href: "/tasks",
        icon: GoCheckCircle,
        activeIcon: GoCheckCircleFill,
    },
    {
        label: "Paramètres",
        href: "/settings",
        icon: SettingsIcon,
        activeIcon: SettingsIcon,
    },
    {
        label: "Membres",
        href: "/members",
        icon: UsersIcon,
        activeIcon: UsersIcon,
    },
]

export const Navigation = () => {
    const workspaceId = useWorkspaceId()
    const pathname = usePathname()

    return (
        <ul className="flex flex-col">
            {routes.map((item) => {
                const fullHref = `/workspaces/${workspaceId}${item.href}`
                const isActive = pathname === fullHref
                const Icon = isActive ? item.activeIcon : item.icon

                return (
                    <Link key={item.href} href={fullHref}>
                        <div className={cn(
                            "flex items-center gap-2.5 p-2.5 rounded-md font-medium hover:text-foreground transition text-muted-foreground",
                            isActive && "bg-card shadow-sm hover:opacity-100 text-foreground",
                        )}>
                            <Icon className="size-5 text-muted-foreground"/>
                            {item.label}
                        </div>
                    </Link>
                )
            })}
        </ul>
    )
}