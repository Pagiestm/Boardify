"use client"

import { useTheme } from "next-themes"
import { CheckIcon, MonitorIcon, MoonIcon, SunIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export const THEME_OPTIONS = [
    { value: "light", label: "Clair", icon: SunIcon },
    { value: "dark", label: "Sombre", icon: MoonIcon },
    { value: "system", label: "Système", icon: MonitorIcon },
] as const

export const ThemeToggle = ({ className }: { className?: string }) => {
    const { theme, setTheme } = useTheme()

    return (
        <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Changer le thème"
                    className={cn("relative text-muted-foreground", className)}
                >
                    <SunIcon className="scale-100 rotate-0 transition-transform dark:scale-0 dark:-rotate-90" />
                    <MoonIcon className="absolute scale-0 rotate-90 transition-transform dark:scale-100 dark:rotate-0" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
                {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
                    <DropdownMenuItem key={value} onSelect={() => setTheme(value)}>
                        <Icon className="text-muted-foreground" />
                        <span className="flex-1">{label}</span>
                        {theme === value && <CheckIcon className="text-primary" />}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
