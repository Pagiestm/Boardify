import React, { useCallback, useState } from "react";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";

import { KanbanCard } from "./kanban-card";
import { EyeIcon, PlusIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

import { ColumnActions, KanbanColumnHeader } from "./kanban-column-header";
import { DeleteColumnDialog } from "./delete-column-dialog";

import { cn } from "@/lib/utils";

import { PopulatedTask } from "../types";
import { BoardColumn } from "@/features/projects/types";
import { createColumnId, defaultBoardColumns } from "@/features/projects/utils";

type TasksState = Record<string, PopulatedTask[]>;

const groupTasks = (data: PopulatedTask[], columns: BoardColumn[]): TasksState => {
  const grouped: TasksState = {};
  for (const column of columns) grouped[column.id] = [];

  const fallbackId = columns[0]?.id;

  data.forEach((task) => {
    const id = task.status;
    const target = grouped[id] ? id : grouped[task.status] ? task.status : fallbackId;
    if (!target) return;
    grouped[target].push(task);
  });

  Object.values(grouped).forEach((column) => {
    column.sort((a, b) => a.position - b.position);
  });

  return grouped;
};

interface DataKanbanProps {
  data: PopulatedTask[];
  columns?: BoardColumn[];
  onColumnsChange?: (columns: BoardColumn[]) => void;
  onChange: (tasks: { $id: string; status: string; position: number }[]) => void;
}

export const DataKanban = ({ data, columns, onColumnsChange, onChange }: DataKanbanProps) => {
  const allColumns = columns ?? defaultBoardColumns();
  const visibleColumns = allColumns.filter((column) => !column.hidden);
  const hiddenColumns = allColumns.filter((column) => column.hidden);

  const [tasks, setTasks] = useState<TasksState>(() => groupTasks(data, allColumns));
  const [prevData, setPrevData] = useState(data);
  const [columnToDelete, setColumnToDelete] = useState<BoardColumn | null>(null);

  const columnKey = allColumns.map((column) => column.id).join(",");
  const [prevColumnKey, setPrevColumnKey] = useState(columnKey);

  if (data !== prevData || columnKey !== prevColumnKey) {
    setPrevData(data);
    setPrevColumnKey(columnKey);
    setTasks(groupTasks(data, allColumns));
  }

  const patchColumn = (id: string, patch: Partial<BoardColumn>) => {
    onColumnsChange?.(
      allColumns.map((column) => (column.id === id ? { ...column, ...patch } : column)),
    );
  };

  const moveColumn = (id: string, direction: -1 | 1) => {
    const index = allColumns.findIndex((column) => column.id === id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= allColumns.length) return;

    const next = [...allColumns];
    [next[index], next[target]] = [next[target], next[index]];
    onColumnsChange?.(next);
  };

  const addColumn = () => {
    onColumnsChange?.([
      ...allColumns,
      {
        id: createColumnId(),
        label: "Nouveau statut",
        color: "zinc",
        hidden: false,
        done: false,
      },
    ]);
  };

  const deleteColumn = (targetId: string) => {
    if (!columnToDelete) return;

    const moved = (tasks[columnToDelete.id] ?? []).map((task, index) => ({
      $id: task.$id,
      status: targetId,
      position: Math.min((index + 1) * 1000, 1_000_000),
    }));

    if (moved.length > 0) onChange(moved);
    onColumnsChange?.(allColumns.filter((column) => column.id !== columnToDelete.id));
    setColumnToDelete(null);
  };

  const columnActions = (column: BoardColumn): ColumnActions | undefined => {
    if (!onColumnsChange) return undefined;

    const index = visibleColumns.findIndex((item) => item.id === column.id);

    return {
      onRename: (label) => patchColumn(column.id, { label }),
      onRecolor: (color) => patchColumn(column.id, { color }),
      onHide: () => patchColumn(column.id, { hidden: true }),
      onToggleDone: () => patchColumn(column.id, { done: !column.done }),
      onDelete: () => setColumnToDelete(column),
      onMove: (direction) => moveColumn(column.id, direction),
      canMoveLeft: index > 0,
      canMoveRight: index < visibleColumns.length - 1,
      canHide: visibleColumns.length > 1,
      canDelete: allColumns.length > 1,
    };
  };

  const onDragEnd = useCallback(
    (result: DropResult) => {
      if (!result.destination) return;

      if (result.type === "COLUMN") {
        if (result.source.index === result.destination.index) return;

        const reordered = [...visibleColumns];
        const [moved] = reordered.splice(result.source.index, 1);
        reordered.splice(result.destination.index, 0, moved);

        const hidden = allColumns.filter((column) => column.hidden);
        onColumnsChange?.([...reordered, ...hidden]);
        return;
      }

      const { source, destination } = result;
      const sourceId = source.droppableId;
      const destId = destination.droppableId;
      let updatesPayload: { $id: string; status: string; position: number }[] = [];

      setTasks((prevTasks) => {
        const newTasks = { ...prevTasks };

        const sourceColumn = [...(newTasks[sourceId] ?? [])];
        const [movedTask] = sourceColumn.splice(source.index, 1);

        if (!movedTask) {
          console.error("No task found at the source index");
          return prevTasks;
        }

        const updatedMovedTask = sourceId !== destId ? { ...movedTask, status: destId } : movedTask;

        newTasks[sourceId] = sourceColumn;

        const destColumn = [...(newTasks[destId] ?? [])];
        destColumn.splice(destination.index, 0, updatedMovedTask);
        newTasks[destId] = destColumn;

        updatesPayload = [];

        updatesPayload.push({
          $id: updatedMovedTask.$id,
          status: destId,
          position: Math.min((destination.index + 1) * 1000, 1_000_000),
        });

        newTasks[destId].forEach((task, index) => {
          if (task && task.$id !== updatedMovedTask.$id) {
            const newPosition = Math.min((index + 1) * 1000, 1_000_000);
            if (task.position !== newPosition) {
              updatesPayload.push({
                $id: task.$id,
                status: destId,
                position: newPosition,
              });
            }
          }
        });

        if (sourceId !== destId) {
          newTasks[sourceId].forEach((task, index) => {
            if (task) {
              const newPosition = Math.min((index + 1) * 1000, 1_000_000);
              if (task.position !== newPosition) {
                updatesPayload.push({
                  $id: task.$id,
                  status: sourceId,
                  position: newPosition,
                });
              }
            }
          });
        }

        return newTasks;
      });

      onChange(updatesPayload);
    },
    [onChange, allColumns, visibleColumns, onColumnsChange],
  );

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="board" type="COLUMN" direction="horizontal">
        {(boardProvided) => (
          <div
            ref={boardProvided.innerRef}
            {...boardProvided.droppableProps}
            className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 lg:snap-none"
          >
            {visibleColumns.map((column, columnIndex) => {
              const board = column.id;

              return (
                <Draggable
                  key={board}
                  draggableId={`column-${board}`}
                  index={columnIndex}
                  isDragDisabled={!onColumnsChange}
                >
                  {(columnProvided) => (
                    <div
                      ref={columnProvided.innerRef}
                      {...columnProvided.draggableProps}
                      className="flex w-[272px] min-w-[272px] flex-1 snap-start flex-col rounded-lg bg-muted/40 p-2"
                    >
                      <KanbanColumnHeader
                        column={column}
                        taskCount={(tasks[board] ?? []).length}
                        actions={columnActions(column)}
                        dragHandleProps={columnProvided.dragHandleProps}
                      />
                      <Droppable droppableId={board} type="TASK">
                        {(provided, snapshot) => (
                          <div
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                            className={cn(
                              "min-h-[200px] flex-1 rounded-md transition-colors",
                              snapshot.isDraggingOver && "bg-primary/5",
                            )}
                          >
                            {(tasks[board] ?? []).length === 0 && !snapshot.isDraggingOver && (
                              <div className="flex h-20 items-center justify-center rounded-md border border-dashed text-xs text-muted-foreground">
                                Aucune tâche
                              </div>
                            )}
                            {(tasks[board] ?? []).map((task, index) => (
                              <Draggable key={task.$id} draggableId={task.$id} index={index}>
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                  >
                                    <KanbanCard task={task} isDragging={snapshot.isDragging} />
                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </div>
                  )}
                </Draggable>
              );
            })}
            {boardProvided.placeholder}

            {onColumnsChange && (
              <div className="flex w-[200px] min-w-[200px] shrink-0 flex-col gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={addColumn}
                  className="justify-start text-muted-foreground"
                >
                  <PlusIcon />
                  Ajouter un statut
                </Button>
              </div>
            )}

            {onColumnsChange && hiddenColumns.length > 0 && (
              <div className="flex w-[200px] min-w-[200px] shrink-0 flex-col gap-1 rounded-lg border border-dashed p-2">
                <p className="px-1 text-xs text-muted-foreground">
                  {hiddenColumns.length} statut{hiddenColumns.length > 1 ? "s" : ""} masqué
                  {hiddenColumns.length > 1 ? "s" : ""}
                </p>
                {hiddenColumns.map((column) => (
                  <Button
                    key={column.id}
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="justify-start text-muted-foreground"
                    onClick={() => patchColumn(column.id, { hidden: false })}
                  >
                    <EyeIcon />
                    {column.label}
                  </Button>
                ))}
              </div>
            )}
          </div>
        )}
      </Droppable>
      <DeleteColumnDialog
        column={columnToDelete}
        targets={allColumns.filter((column) => column.id !== columnToDelete?.id)}
        taskCount={columnToDelete ? (tasks[columnToDelete.id]?.length ?? 0) : 0}
        onCancel={() => setColumnToDelete(null)}
        onConfirm={deleteColumn}
      />
    </DragDropContext>
  );
};
