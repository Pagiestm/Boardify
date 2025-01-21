"use client";

import { usePathname } from "next/navigation";

import { UserButton } from "@/features/auth/components/user-button"

import { MobileSidebar } from "./mobile-sidebar"

const pathnameMap = {
    "tasks": {
        title: "Mes Tâches",
        description: "Consultez toutes vos tâches ici"
    },
    "projects": {
        title: "Mon Projet",
        description: "Consultez les tâches de votre projet ici"
    },
}

const defaultMap = {
    title: "Accueil",
    description: "Suivez tous vos projets et tâches ici"
}

export const Navbar = () => {
    const pathname = usePathname()
    const pathnameParts = pathname.split("/")
    const pathnameKey = pathnameParts[3] as keyof typeof pathnameMap

    const { title, description } = pathnameMap[pathnameKey] || defaultMap

    return (
        <nav className="pt-4 px-6 flex items-center justify-between bg-background">
            <div className="flex-col hidden lg:flex">
                <h1 className="text-2xl font-semibold text-foreground">
                    {title}
                </h1>
                <p className="text-muted-foreground">
                    {description}
                </p>
            </div>
            <MobileSidebar />
            <UserButton />
        </nav>
    )
}