"use client"

import { PlusIcon } from "lucide-react"
import { useRouter } from "next/navigation"

import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id"
import { useGetWorkspaces } from "@/features/workspaces/api/use-get-workspaces"
import { WorkspaceAvatar } from "@/features/workspaces/components/workspace-avatar"
import { useCreateWorkspaceModal } from "@/features/workspaces/hooks/use-create-workspace-modal"

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

export const WorkspaceSwitcher = () => {
    const workspaceId = useWorkspaceId()
    const router = useRouter()
    const { data: workspaces } = useGetWorkspaces()
    const { open } = useCreateWorkspaceModal()

    const onSelect = (id: string) => {
        router.push(`/workspaces/${id}`)
    }

    return (
        <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between px-2.5">
                <p className="text-xs font-medium text-muted-foreground">Espace de travail</p>
                <button
                    type="button"
                    onClick={open}
                    aria-label="Créer un espace de travail"
                    className="rounded-sm p-0.5 text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
                >
                    <PlusIcon className="size-4" />
                </button>
            </div>
            <Select onValueChange={onSelect} value={workspaceId}>
                <SelectTrigger className="h-10 px-2">
                    <SelectValue placeholder="Aucun espace sélectionné" />
                </SelectTrigger>
                <SelectContent>
                    {workspaces?.documents.map((workspace) => (
                        <SelectItem key={workspace.$id} value={workspace.$id}>
                            <WorkspaceAvatar
                                name={workspace.name}
                                image={workspace.imageUrl}
                                className="size-6"
                                fallbackClassName="text-xs"
                            />
                            <span className="truncate font-medium">{workspace.name}</span>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    )
}
