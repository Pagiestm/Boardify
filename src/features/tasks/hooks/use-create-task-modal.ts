import { useQueryState, useQueryStates, parseAsBoolean, parseAsString } from "nuqs";

export const useCreateTaskModal = () => {
  const [isOpen, setIsOpen] = useQueryState(
    "create-task",
    parseAsBoolean.withDefault(false).withOptions({ clearOnDefault: true }),
  );

  const [{ "create-task-column": columnId }, setColumn] = useQueryStates({
    "create-task-column": parseAsString,
  });

  const open = (targetColumnId?: string) => {
    setColumn({ "create-task-column": targetColumnId ?? null });
    setIsOpen(true);
  };

  const close = () => {
    setColumn({ "create-task-column": null });
    setIsOpen(false);
  };

  return {
    isOpen,
    columnId,
    open,
    close,
    setIsOpen,
  };
};
