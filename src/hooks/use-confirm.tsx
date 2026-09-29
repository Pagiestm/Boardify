import { useState } from "react";

import { Button, type ButtonProps } from "@/components/ui/button";
import { ResponsiveModal } from "@/components/responsive-modal";

export const useConfirm = (
    title: string,
    message: string,
    variant: ButtonProps["variant"] = "primary",
): [() => React.JSX.Element, () => Promise<unknown>] => {
    const [promise, setPromise] = useState<{ resolve: (value: boolean) => void } | null>(null);

    const confirm = () => {
        return new Promise((resolve) => {
            setPromise({ resolve })
        })
    }

    const handleClose = () => {
        promise?.resolve(false)
        setPromise(null)
    }

    const handleConfirm = () => {
        promise?.resolve(true)
        setPromise(null)
    }

    const ConfirmationDialog = () => (
        <ResponsiveModal open={promise !== null} onopenchange={handleClose} title={title}>
            <div className="space-y-2 p-6 pr-12">
                <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
                <p className="text-sm text-muted-foreground">{message}</p>
            </div>
            <div className="flex flex-col-reverse gap-2 border-t px-6 py-4 sm:flex-row sm:justify-end">
                <Button onClick={handleClose} variant="ghost">
                    Annuler
                </Button>
                <Button onClick={handleConfirm} variant={variant} autoFocus>
                    Confirmer
                </Button>
            </div>
        </ResponsiveModal>
    )

    return [ConfirmationDialog, confirm]
}
