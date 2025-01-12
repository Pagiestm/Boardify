"use client"

import { ResponsiveModal } from "@/components/responsive-modal";

import { EditTaskFormWrapper } from "./edit-task-form-wrapper";

import { useEditTaskModal } from "../hooks/use-edit-task-modal";

export const EditTaskModal = () => {
    const { taskId, close } = useEditTaskModal()

    return (
        <ResponsiveModal open={!!taskId} onopenchange={close}>
            {taskId && (
                <EditTaskFormWrapper id={taskId} onCancel={close} />
            )}
        </ResponsiveModal>
    )
}