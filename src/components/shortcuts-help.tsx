"use client"

import { useEffect, useSyncExternalStore } from "react"

import { Kbd } from "@/components/ui/kbd"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

export const SHORTCUTS: { keys: string[]; label: string }[] = [
    { keys: ["⌘", "K"], label: "Rechercher" },
    { keys: ["N"], label: "Nouvelle tâche" },
    { keys: ["P"], label: "Nouveau projet" },
    { keys: ["G", "H"], label: "Aller à l'accueil" },
    { keys: ["G", "T"], label: "Aller à mes tâches" },
    { keys: ["G", "S"], label: "Aller aux paramètres" },
    { keys: ["G", "M"], label: "Aller aux membres" },
    { keys: ["?"], label: "Afficher les raccourcis" },
]

// Tiny shared store so the navbar, hotkeys and palette can open the help dialog.
let isOpen = false
// How many instances of the dialog are mounted (0 outside the dashboard layout).
let mounted = 0
const listeners = new Set<() => void>()
const notify = () => listeners.forEach((listener) => listener())
const setOpen = (value: boolean) => {
    isOpen = value
    notify()
}
const subscribe = (listener: () => void) => {
    listeners.add(listener)
    return () => listeners.delete(listener)
}

export const useShortcutsHelp = () => {
    const open = useSyncExternalStore(subscribe, () => isOpen, () => false)
    const available = useSyncExternalStore(subscribe, () => mounted > 0, () => false)

    return {
        isOpen: open,
        available,
        open: () => setOpen(true),
        close: () => setOpen(false),
        toggle: () => setOpen(!isOpen),
        setOpen,
    }
}

export const ShortcutsHelp = () => {
    const { isOpen: open, setOpen: onOpenChange } = useShortcutsHelp()
    useEffect(() => {
        mounted++
        notify()
        return () => {
            mounted--
            notify()
        }
    }, [])

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Raccourcis clavier</DialogTitle>
                    <DialogDescription>
                        Désactivés pendant la saisie dans un champ.
                    </DialogDescription>
                </DialogHeader>
                <ul className="divide-y">
                    {SHORTCUTS.map(({ keys, label }) => (
                        <li key={label} className="flex items-center justify-between gap-4 py-2.5 text-sm">
                            <span>{label}</span>
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                {keys.map((key, index) => (
                                    <span key={index} className="flex items-center gap-1">
                                        {index > 0 && keys[0] === "G" && <span>puis</span>}
                                        <Kbd>{key}</Kbd>
                                    </span>
                                ))}
                            </span>
                        </li>
                    ))}
                </ul>
            </DialogContent>
        </Dialog>
    )
}
