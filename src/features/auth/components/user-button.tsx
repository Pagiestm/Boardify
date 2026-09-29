"use client"

import { KeyboardIcon, LogOutIcon, SearchIcon } from "lucide-react"

import { cn, getAvatarColor, getInitial } from "@/lib/utils"
import { Kbd } from "@/components/ui/kbd"
import { Skeleton } from "@/components/ui/skeleton"
import { useShortcutsHelp } from "@/components/shortcuts-help"
import { useCommandPalette } from "@/components/command-palette"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { useLogout } from "../api/use-logout"
import { useCurrent } from "../api/use-current"

export const UserButton = () => {
    const { mutate: logout, isPending } = useLogout()
    const { data: user, isLoading } = useCurrent()
    const palette = useCommandPalette()
    const help = useShortcutsHelp()

    if (isLoading) {
        return <Skeleton className="size-8 rounded-full" />
    }

    if (!user) {
        return null
    }

    const { name, email } = user
    const displayName = name || email
    const color = getAvatarColor(displayName)

    return (
        <DropdownMenu modal={false}>
            <DropdownMenuTrigger
                aria-label="Menu du compte"
                className={cn(
                    "flex size-8 items-center justify-center rounded-full text-xs font-semibold outline-none transition-opacity hover:opacity-85 focus-visible:ring-[3px] focus-visible:ring-ring/40",
                    color,
                )}
            >
                {getInitial(displayName)}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="bottom" className="w-60" sideOffset={8}>
                <div className="flex items-center gap-3 px-2 py-2">
                    <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold", color)}>
                        {getInitial(displayName)}
                    </div>
                    <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{name || "Utilisateur"}</p>
                        <p className="truncate text-xs text-muted-foreground">{email}</p>
                    </div>
                </div>
                <DropdownMenuSeparator />
                {palette.available && (
                    <>
                        <DropdownMenuItem onSelect={palette.open}>
                            <SearchIcon className="text-muted-foreground" />
                            <span className="flex-1">Rechercher</span>
                            <Kbd>⌘K</Kbd>
                        </DropdownMenuItem>
                        {help.available && (
                            <DropdownMenuItem onSelect={help.open}>
                                <KeyboardIcon className="text-muted-foreground" />
                                <span className="flex-1">Raccourcis clavier</span>
                                <Kbd>?</Kbd>
                            </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                    </>
                )}
                <DropdownMenuItem
                    variant="destructive"
                    disabled={isPending}
                    onSelect={() => logout()}
                >
                    <LogOutIcon />
                    Se déconnecter
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
