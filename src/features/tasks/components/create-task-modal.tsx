"use client"

import { ResponsiveModal } from "@/components/responsive-modal";

import { CreateTaskFormWrapper } from "./create-task-form-wrapper";

import { useCreateTaskModal } from "../hooks/use-create-task-modal";

export const CreateTaskModal = () => {
    const { isOpen, setIsOpen, close , defaultProjet } = useCreateTaskModal()

    return (
        <ResponsiveModal open={isOpen} onopenchange={setIsOpen}>
            <div>
                <CreateTaskFormWrapper onCancel={close} selectProjetId ={defaultProjet}/>
            </div>
        </ResponsiveModal>
    )
}