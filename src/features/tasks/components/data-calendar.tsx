import { useState } from "react";
import { format, getDay, parse, startOfWeek, addMonths, subMonths } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

import { EventCard } from "./event-card";

import { PopulatedTask } from "../types";

import "react-big-calendar/lib/css/react-big-calendar.css";

const locales = {
  fr,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface DataCalendarProps {
  data: PopulatedTask[];
}

interface CustomToolbarProps {
  date: Date;
  onNavigate: (action: "PREV" | "NEXT" | "TODAY") => void;
}

const CustomToolbar = ({ date, onNavigate }: CustomToolbarProps) => {
  const label = format(date, "MMMM yyyy", { locale: fr });

  return (
    <div className="mb-4 flex w-full items-center justify-between gap-3">
      <p className="text-base font-semibold">{label.charAt(0).toUpperCase() + label.slice(1)}</p>
      <div className="flex items-center gap-1">
        <Button onClick={() => onNavigate("TODAY")} variant="outline" size="sm" className="mr-1">
          Aujourd&apos;hui
        </Button>
        <Button
          onClick={() => onNavigate("PREV")}
          variant="ghost"
          size="icon-sm"
          aria-label="Mois précédent"
        >
          <ChevronLeftIcon />
        </Button>
        <Button
          onClick={() => onNavigate("NEXT")}
          variant="ghost"
          size="icon-sm"
          aria-label="Mois suivant"
        >
          <ChevronRightIcon />
        </Button>
      </div>
    </div>
  );
};

export const DataCalendar = ({ data }: DataCalendarProps) => {
  const datedTasks = data.filter((task) => Boolean(task.dueDate));

  const [value, setValue] = useState(
    datedTasks.length > 0 ? new Date(datedTasks[0].dueDate) : new Date(),
  );

  const events = datedTasks.map((task) => ({
    start: new Date(task.dueDate),
    end: new Date(task.dueDate),
    title: task.name,
    project: task.project,
    assignee: task.assignee,
    status: task.status,
    statusColumn: task.statusColumn,
    id: task.$id,
  }));

  const handleNavigate = (action: "PREV" | "NEXT" | "TODAY") => {
    if (action === "PREV") {
      setValue(subMonths(value, 1));
    } else if (action === "NEXT") {
      setValue(addMonths(value, 1));
    } else if (action === "TODAY") {
      setValue(new Date());
    }
  };

  return (
    <div
      className={cn(
        "boardify-calendar overflow-x-auto",
        "[&_.rbc-button-link]:inline-flex! [&_.rbc-button-link]:h-6! [&_.rbc-button-link]:min-w-6! [&_.rbc-button-link]:items-center! [&_.rbc-button-link]:justify-center! [&_.rbc-button-link]:rounded-full! [&_.rbc-button-link]:px-1! [&_.rbc-button-link]:text-xs! [&_.rbc-button-link]:text-foreground! [&_.rbc-button-link]:tabular-nums! [&_.rbc-date-cell]:px-2! [&_.rbc-date-cell]:pt-1.5! [&_.rbc-date-cell]:pb-1! [&_.rbc-date-cell]:text-left! [&_.rbc-day-bg+.rbc-day-bg]:border-l! [&_.rbc-header]:border-b! [&_.rbc-header]:px-2.5! [&_.rbc-header]:py-2! [&_.rbc-header]:text-left! [&_.rbc-header]:text-xs! [&_.rbc-header]:font-medium! [&_.rbc-header]:text-muted-foreground! [&_.rbc-header]:capitalize! [&_.rbc-header+.rbc-header]:border-l! [&_.rbc-month-header]:bg-muted! [&_.rbc-month-row]:min-h-32! [&_.rbc-month-row]:overflow-visible! [&_.rbc-month-row+.rbc-month-row]:border-t! [&_.rbc-month-view]:min-h-[34rem]! [&_.rbc-month-view]:overflow-hidden! [&_.rbc-month-view]:rounded-[var(--radius)]! [&_.rbc-month-view]:border! [&_.rbc-month-view]:bg-card! [&_.rbc-now_.rbc-button-link]:bg-primary! [&_.rbc-now_.rbc-button-link]:font-semibold! [&_.rbc-now_.rbc-button-link]:text-primary-foreground! [&_.rbc-off-range_.rbc-button-link]:text-muted-foreground/60! [&_.rbc-off-range-bg]:bg-muted/50! [&_.rbc-row-segment]:px-1.5! [&_.rbc-row-segment]:pb-1! [&_.rbc-show-more]:bg-transparent! [&_.rbc-show-more]:px-2! [&_.rbc-show-more]:text-xs! [&_.rbc-show-more]:font-medium! [&_.rbc-show-more]:text-muted-foreground! [&_.rbc-show-more]:hover:text-foreground! [&_.rbc-show-more]:hover:underline! [&_.rbc-today]:bg-transparent!",
      )}
    >
      <div className="min-w-[720px]">
        <Calendar
          localizer={localizer}
          culture="fr"
          date={value}
          events={events}
          views={["month"]}
          defaultView="month"
          toolbar
          showAllEvents
          className="h-[42rem]"
          max={new Date(new Date().setFullYear(new Date().getFullYear() + 1))}
          formats={{
            weekdayFormat: (date, culture, localizer) =>
              localizer?.format(date, "EEE", culture) ?? "",
          }}
          components={{
            eventWrapper: ({ event }) => (
              <EventCard
                id={event.id}
                title={event.title}
                assignee={event.assignee}
                project={event.project}
                status={event.status}
                statusColumn={event.statusColumn}
              />
            ),
            toolbar: () => <CustomToolbar date={value} onNavigate={handleNavigate} />,
          }}
        />
      </div>
    </div>
  );
};
