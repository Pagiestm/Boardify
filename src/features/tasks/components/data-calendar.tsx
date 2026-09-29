import { useState } from "react";
import {
    format,
    getDay,
    parse,
    startOfWeek,
    addMonths,
    subMonths,
} from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

import { EventCard } from "./event-card";

import { PopulatedTask } from "../types";

import "react-big-calendar/lib/css/react-big-calendar.css";
import "./data-calendar.css";

const locales = {
    fr,
}

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
})

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
            <p className="text-base font-semibold">
                {label.charAt(0).toUpperCase() + label.slice(1)}
            </p>
            <div className="flex items-center gap-1">
                <Button
                    onClick={() => onNavigate("TODAY")}
                    variant="outline"
                    size="sm"
                    className="mr-1"
                >
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
    )
}

export const DataCalendar = ({
    data,
}: DataCalendarProps) => {
    const datedTasks = data.filter((task) => Boolean(task.dueDate));

    const [value, setValue] = useState(
        datedTasks.length > 0 ? new Date(datedTasks[0].dueDate) : new Date()
    )

    const events = datedTasks.map((task) => ({
        start: new Date(task.dueDate),
        end: new Date(task.dueDate),
        title: task.name,
        project: task.project,
        assignee: task.assignee,
        status: task.status,
        id: task.$id,
    }))

    const handleNavigate = (action: "PREV" | "NEXT" | "TODAY") => {
        if (action === "PREV") {
            setValue(subMonths(value, 1))
        } else if (action === "NEXT") {
            setValue(addMonths(value, 1))
        } else if (action === "TODAY") {
            setValue(new Date())
        }
    }

    return (
        <div className="boardify-calendar overflow-x-auto">
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
                    className="h-full"
                    max={new Date(new Date().setFullYear(new Date().getFullYear() + 1))}
                    formats={{
                        weekdayFormat: (date, culture, localizer) => localizer?.format(date, "EEE", culture) ?? "",
                    }}
                    components={{
                        eventWrapper: ({ event }) => (
                            <EventCard
                                id={event.id}
                                title={event.title}
                                assignee={event.assignee}
                                project={event.project}
                                status={event.status}
                            />
                        ),
                        toolbar: () => (
                            <CustomToolbar date={value} onNavigate={handleNavigate} />
                        )
                    }}
                />
            </div>
        </div>
    );
};
