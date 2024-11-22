import { useQueryState, parseAsBoolean } from "nuqs"

export const usecreateProjectModal = () => {
    const [isOpen, setIsOpen] = useQueryState(
        "create-create",
        parseAsBoolean.withDefault(false).withOptions({ clearOnDefault: true })
    )

    const open = () => setIsOpen(true)
    const close = () => setIsOpen(false)

    return {
        isOpen,
        open,
        close,
        setIsOpen,
    }
}