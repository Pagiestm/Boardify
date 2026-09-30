import React, { useCallback, useState } from "react";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";

import { KanbanCard } from "./kanban-card";
import { KanbanColumnHeader } from "./kanban-column-header";

import { cn } from "@/lib/utils";

import { PopulatedTask, TaskStatus } from "../types";
import { TASK_STATUS_ORDER } from "../constants";

const boards = TASK_STATUS_ORDER;

type TasksState = {
  [key in TaskStatus]: PopulatedTask[];
};

const groupTasks = (data: PopulatedTask[]): TasksState => {
  const grouped: TasksState = {
    [TaskStatus.BACKLOG]: [],
    [TaskStatus.TODO]: [],
    [TaskStatus.IN_PROGRESS]: [],
    [TaskStatus.IN_REVIEW]: [],
    [TaskStatus.DONE]: [],
  };

  data.forEach((task) => {
    grouped[task.status]?.push(task);
  });

  Object.values(grouped).forEach((column) => {
    column.sort((a, b) => a.position - b.position);
  });

  return grouped;
};

interface DataKanbanProps {
  data: PopulatedTask[];
  onChange: (tasks: { $id: string; status: TaskStatus; position: number }[]) => void;
}

export const DataKanban = ({ data, onChange }: DataKanbanProps) => {
  const [tasks, setTasks] = useState<TasksState>(() => groupTasks(data));
  const [prevData, setPrevData] = useState(data);

  // Re-sync local (optimistic) columns whenever fresh data arrives
  if (data !== prevData) {
    setPrevData(data);
    setTasks(groupTasks(data));
  }

  const onDragEnd = useCallback(
    (result: DropResult) => {
      if (!result.destination) return;

      const { source, destination } = result;
      const sourceStatus = source.droppableId as TaskStatus;
      const destStatus = destination.droppableId as TaskStatus;

      let updatesPayload: { $id: string; status: TaskStatus; position: number }[] = [];

      setTasks((prevTasks) => {
        const newTasks = { ...prevTasks };

        const sourceColumn = [...newTasks[sourceStatus]];
        const [movedTask] = sourceColumn.splice(source.index, 1);

        if (!movedTask) {
          console.error("No task found at the source index");
          return prevTasks;
        }

        const updatedMovedTask =
          sourceStatus !== destStatus ? { ...movedTask, status: destStatus } : movedTask;

        newTasks[sourceStatus] = sourceColumn;

        const destColumn = [...newTasks[destStatus]];
        destColumn.splice(destination.index, 0, updatedMovedTask);
        newTasks[destStatus] = destColumn;

        updatesPayload = [];

        updatesPayload.push({
          $id: updatedMovedTask.$id,
          status: destStatus,
          position: Math.min((destination.index + 1) * 1000, 1_000_000),
        });

        newTasks[destStatus].forEach((task, index) => {
          if (task && task.$id !== updatedMovedTask.$id) {
            const newPosition = Math.min((index + 1) * 1000, 1_000_000);
            if (task.position !== newPosition) {
              updatesPayload.push({
                $id: task.$id,
                status: destStatus,
                position: newPosition,
              });
            }
          }
        });

        if (sourceStatus !== destStatus) {
          newTasks[sourceStatus].forEach((task, index) => {
            if (task) {
              const newPosition = Math.min((index + 1) * 1000, 1_000_000);
              if (task.position !== newPosition) {
                updatesPayload.push({
                  $id: task.$id,
                  status: sourceStatus,
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
    [onChange],
  );

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 lg:snap-none">
        {boards.map((board) => {
          return (
            <div
              key={board}
              className="flex w-[272px] min-w-[272px] flex-1 snap-start flex-col rounded-lg bg-muted/40 p-2"
            >
              <KanbanColumnHeader board={board} taskCount={tasks[board].length} />
              <Droppable droppableId={board}>
                {(provided, snapshot) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className={cn(
                      "min-h-[200px] flex-1 rounded-md transition-colors",
                      snapshot.isDraggingOver && "bg-primary/5",
                    )}
                  >
                    {tasks[board].length === 0 && !snapshot.isDraggingOver && (
                      <div className="flex h-20 items-center justify-center rounded-md border border-dashed text-xs text-muted-foreground">
                        Aucune tâche
                      </div>
                    )}
                    {tasks[board].map((task, index) => (
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
          );
        })}
      </div>
    </DragDropContext>
  );
};
