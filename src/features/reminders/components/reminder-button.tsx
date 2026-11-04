"use client";

import { useState } from "react";
import { AlarmClockIcon, BellPlusIcon, XIcon } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import { formatReminder, quickReminders, toDateTimeLocal } from "../utils";
import { useCreateReminder, useDeleteReminder, useGetReminders } from "../api/use-reminders";

interface ReminderButtonProps {
  taskId: string;
}

/** « Me rappeler cette tâche » : choix rapides, date libre et rappels en attente (personnels). */
export const ReminderButton = ({ taskId }: ReminderButtonProps) => {
  const { data } = useGetReminders({ taskId });
  const { mutate: create, isPending } = useCreateReminder();
  const { mutate: remove } = useDeleteReminder();
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState("");
  // Les choix rapides sont recalculés à chaque ouverture, à l'heure locale.
  const [now, setNow] = useState(() => new Date());

  if (!data?.enabled) return null;

  const reminders = data.reminders;
  const schedule = (date: Date) =>
    create(
      { json: { taskId, remindAt: date.toISOString() } },
      {
        onSuccess: () => {
          setCustom("");
          setOpen(false);
        },
      },
    );

  const customDate = custom ? new Date(custom) : null;
  const customValid = customDate !== null && customDate > now;

  return (
    <Popover
      open={open}
      onOpenChange={(value) => {
        if (value) setNow(new Date());
        setOpen(value);
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="relative shrink-0"
          title="Me rappeler cette tâche"
        >
          {reminders.length > 0 ? <AlarmClockIcon className="text-primary" /> : <BellPlusIcon />}
          <span className="hidden sm:inline">Rappel</span>
          {reminders.length > 0 && (
            <span className="absolute -top-1.5 -right-1.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
              {reminders.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" collisionPadding={12} className="w-72 p-2">
        <p className="px-2 pt-1 pb-2 text-sm font-medium">Me rappeler cette tâche</p>
        <div className="flex flex-col">
          {quickReminders(now).map((option) => (
            <button
              key={option.id}
              type="button"
              disabled={isPending}
              onClick={() => schedule(option.date)}
              className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted disabled:opacity-50"
            >
              <span>{option.label}</span>
              <span className="text-xs text-muted-foreground">
                {formatReminder(option.date, now)}
              </span>
            </button>
          ))}
        </div>
        <form
          className="mt-1 flex gap-2 px-2 pb-1"
          onSubmit={(event) => {
            event.preventDefault();
            if (customDate && customValid) schedule(customDate);
          }}
        >
          <Input
            type="datetime-local"
            value={custom}
            min={toDateTimeLocal(now)}
            onChange={(event) => setCustom(event.target.value)}
            aria-label="Date et heure du rappel"
            className="h-8 min-w-0 text-xs"
          />
          <Button type="submit" size="sm" disabled={!customValid || isPending}>
            OK
          </Button>
        </form>

        {reminders.length > 0 && (
          <>
            <Separator className="my-2" />
            <p className="px-2 pb-1 text-xs font-medium text-muted-foreground">Prévus</p>
            <ul className="flex flex-col">
              {reminders.map((reminder) => (
                <li
                  key={reminder.$id}
                  className="flex items-center gap-2 rounded-md px-2 py-1 text-sm"
                >
                  <AlarmClockIcon className="size-3.5 shrink-0 text-muted-foreground" />
                  <span className="flex-1 truncate">
                    {formatReminder(new Date(reminder.remindAt), now)}
                  </span>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    className="size-7"
                    aria-label="Supprimer ce rappel"
                    onClick={() => remove({ param: { reminderId: reminder.$id } })}
                  >
                    <XIcon />
                  </Button>
                </li>
              ))}
            </ul>
          </>
        )}
        <p className="px-2 pt-2 text-[11px] text-muted-foreground">
          Le rappel arrive dans vos notifications, vous seul le voyez.
        </p>
      </PopoverContent>
    </Popover>
  );
};
