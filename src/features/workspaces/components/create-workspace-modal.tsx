"use client"

import { ResponsiveModal } from "@/components/responsive-modal";

import { CreateWorkspaceForm } from "./create-workspace-form";

import { useCreateWorkspaceModal } from "../hooks/use-create-workspace-modal";

export const CreateWorkspaceModal = () => {
    const { isOpen, setIsOpen, close } = useCreateWorkspaceModal()

    return (
        <ResponsiveModal
            open={isOpen}
            onopenchange={setIsOpen}
            title="Créer un espace de travail"
        >
            <CreateWorkspaceForm onCancel={close} />
        </ResponsiveModal>
    )
}
