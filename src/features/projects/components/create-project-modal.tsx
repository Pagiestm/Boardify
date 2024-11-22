"use client"

import { ResponsiveModal } from "@/components/responsive-modal";

import { CreateProjectForm } from "./create-project-form";

import { usecreateProjectModal } from "../hooks/use-create-project-modal";

export const CreateProjectModal = () => {
    const { isOpen, setIsOpen, close } = usecreateProjectModal()

    return (
        <ResponsiveModal open={isOpen} onopenchange={setIsOpen}>
            <CreateProjectForm onCancel={close}/>
        </ResponsiveModal>
    )
}