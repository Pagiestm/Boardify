"use client"

import { Loader, LogOut, Moon, Sun } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DottedSeparator } from "@/components/dotted-separator"
import { useTheme } from "next-themes"

import { useLogout } from "../api/use-logout"
import { useCurrent } from "../api/use-current"

export const UserButton = () => {
    const { mutate: logout } = useLogout()
    const { data: user, isLoading } = useCurrent()
    const { theme, setTheme } = useTheme()

    if (isLoading) {
        return (
            <div className="size-10 rounded-full flex items-center justify-center bg-secondary border-border">
                <Loader className="size-4 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (!user) {
        return null
    }

    const { name, email } = user

    const avatarFallback = name
        ? name.charAt(0).toUpperCase()
        : email.charAt(0).toUpperCase() ?? "U"

    return (
        <DropdownMenu modal={false}>
            <DropdownMenuTrigger className="outline-none relative">
                <Avatar className="size-10 hover:opacity-75 transition border border-border">
                    <AvatarFallback className="bg-secondary font-medium text-muted-foreground items-center justify-center">
                        {avatarFallback}
                    </AvatarFallback>
                </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="bottom" className="w-60" sideOffset={10}>
                <div className="flex flex-col items-center justify-center gap-2 px-2.5 py-4">
                    <Avatar className="size-[52px] border border-neutral-300">
                        <AvatarFallback className="bg-neutral-200 text-xl font-medium text-neutral-500 items-center justify-center">
                            {avatarFallback}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-center justify-center">
                        <p className="text-sm font-medium text-foreground">
                            {name || "User"}
                        </p>
                        <p className="text-sm text-muted-foreground">{email}</p>
                    </div>
                </div>
                <DottedSeparator className="mb-1" />
                <DropdownMenuItem
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                    className="h-10 flex items-center justify-center font-medium cursor-pointer"
                >
                    {theme === "dark" ? (
                        <Sun className="size-4 mr-2" />
                    ) : (
                        <Moon className="size-4 mr-2" />
                    )}
                    {theme === "dark" ? "Mode clair" : "Mode sombre"}
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={() => logout()}
                    className="h-10 flex items-center justify-center text-red-600 font-medium cursor-pointer"
                >
                    <LogOut className="size-4 mr-2" />
                    Déconnexion
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}