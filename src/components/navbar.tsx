"use client";

import { SearchIcon } from "lucide-react";
import { usePathname } from "next/navigation";

import { UserButton } from "@/features/auth/components/user-button"

import { Kbd } from "@/components/ui/kbd"
import { Button } from "@/components/ui/button"

import { ThemeToggle } from "./theme-toggle"
import { MobileSidebar } from "./mobile-sidebar"
import { useCommandPalette } from "./command-palette"

const pathnameMap: Record<string, { title: string; description: string }> = {
    tasks: {
        title: "Mes tâches",
        description: "Retrouvez toutes vos tâches.",
    },
    projects: {
        title: "Projet",
        description: "Les tâches de ce projet.",
    },
}

const defaultMap = {
    title: "Accueil",
    description: "Vue d'ensemble de vos projets et tâches.",
}

export const Navbar = () => {
    const pathname = usePathname()
    const { open } = useCommandPalette()

    const section = pathname.split("/")[3]
    const { title, description } = pathnameMap[section] ?? defaultMap

    return (
        <header className="sticky top-0 z-30 border-b bg-background">
            <div className="flex h-14 items-center justify-between gap-3 px-4 md:px-6">
                <div className="flex min-w-0 items-center gap-2">
                    <MobileSidebar />
                    <div className="min-w-0">
                        <h1 className="truncate text-sm font-semibold">{title}</h1>
                        <p className="hidden truncate text-xs text-muted-foreground md:block">{description}</p>
                    </div>
                </div>
                <div className="flex items-center gap-1.5">
                    <button
                        type="button"
                        onClick={open}
                        className="hidden h-8 w-56 items-center gap-2 rounded-md border bg-background px-2.5 text-sm text-muted-foreground shadow-xs transition-colors hover:bg-accent md:flex"
                    >
                        <SearchIcon className="size-4" />
                        <span className="flex-1 text-left">Rechercher…</span>
                        <Kbd>⌘K</Kbd>
                    </button>
                    <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={open}
                        aria-label="Rechercher"
                        className="md:hidden"
                    >
                        <SearchIcon />
                    </Button>
                    <ThemeToggle />
                    <UserButton />
                </div>
            </div>
        </header>
    )
}
