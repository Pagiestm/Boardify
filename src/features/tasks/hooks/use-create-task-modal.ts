import { useQueryState, parseAsBoolean, parseAsString } from 'nuqs';

export const useCreateTaskModal = () => {
    const [isOpen, setIsOpen] = useQueryState(
        "create-task",
        parseAsBoolean.withDefault(false).withOptions({ clearOnDefault: true })
    )

    const [defaultProjet, setDefaultProjet] = useQueryState(
        "default-project",
        parseAsString.withDefault("")
    );


    const open = (id : string | undefined) => {
        setIsOpen(true)
        if(id){
            setDefaultProjet(id);
        }
    }
    const close = () => {
        setIsOpen(false)
        setDefaultProjet("");
    } 

    return {
        isOpen,
        open,
        close,
        setIsOpen,
        defaultProjet,
        setDefaultProjet,
    }
}