"use client";

import { useState } from "react";
import { PlusIcon, XIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import {
  useCreateChecklistItem,
  useDeleteChecklistItem,
  useGetChecklist,
  useUpdateChecklistItem,
} from "../api/use-checklist";

interface TaskChecklistProps {
  taskId: string;
}

export const TaskChecklist = ({ taskId }: TaskChecklistProps) => {
  const { data: items, isLoading } = useGetChecklist({ taskId });
  const { mutate: createItem, isPending: isCreating } = useCreateChecklistItem();
  const { mutate: updateItem } = useUpdateChecklistItem();
  const { mutate: deleteItem } = useDeleteChecklistItem();
  const [newTitle, setNewTitle] = useState("");
  const [editing, setEditing] = useState<{ id: string; title: string } | null>(null);

  const total = items?.length ?? 0;
  const done = items?.filter((item) => item.done).length ?? 0;

  const add = () => {
    const title = newTitle.trim();
    if (!title) return;
    createItem({ json: { taskId, title } }, { onSuccess: () => setNewTitle("") });
  };

  const saveEdit = () => {
    if (!editing) return;
    const title = editing.title.trim();
    const current = items?.find((item) => item.$id === editing.id);
    if (title && title !== current?.title) {
      updateItem({ param: { itemId: editing.id }, json: { title } });
    }
    setEditing(null);
  };

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-2 border-b py-3">
        <CardTitle className="text-sm">Sous-tâches</CardTitle>
        {total > 0 && (
          <span className="text-xs text-muted-foreground">
            {done}/{total}
          </span>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-1 py-3">
        {total > 0 && (
          <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${(done / total) * 100}%` }}
            />
          </div>
        )}
        {isLoading ? (
          <Skeleton className="h-6 w-2/3" />
        ) : (
          items?.map((item) => (
            <div
              key={item.$id}
              className="group flex min-h-8 items-center gap-2.5 rounded-md px-1 hover:bg-muted/60"
            >
              <Checkbox
                checked={item.done ?? false}
                onCheckedChange={(checked) =>
                  updateItem({ param: { itemId: item.$id }, json: { done: checked === true } })
                }
                aria-label={`Marquer « ${item.title} » comme faite`}
              />
              {editing?.id === item.$id ? (
                <Input
                  value={editing.title}
                  autoFocus
                  className="h-7"
                  onChange={(event) => setEditing({ id: item.$id, title: event.target.value })}
                  onBlur={saveEdit}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") saveEdit();
                    if (event.key === "Escape") setEditing(null);
                  }}
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setEditing({ id: item.$id, title: item.title })}
                  className={cn(
                    "min-w-0 flex-1 truncate text-left text-sm",
                    item.done && "text-muted-foreground line-through",
                  )}
                >
                  {item.title}
                </button>
              )}
              <Button
                variant="ghost"
                size="icon-sm"
                className="size-6 opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                onClick={() => deleteItem({ param: { itemId: item.$id } })}
                aria-label={`Supprimer « ${item.title} »`}
              >
                <XIcon />
              </Button>
            </div>
          ))
        )}
        <div className="mt-1 flex items-center gap-2">
          <PlusIcon className="ml-1 size-4 shrink-0 text-muted-foreground" />
          <Input
            value={newTitle}
            placeholder="Ajouter une sous-tâche"
            className="h-8 border-none px-1 shadow-none focus-visible:ring-0"
            disabled={isCreating}
            onChange={(event) => setNewTitle(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") add();
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
};
