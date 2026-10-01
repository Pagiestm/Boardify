"use client";

import * as React from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import type { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface DateRangePickerProps {
  from: Date | undefined;
  to: Date | undefined;
  onChange: (range: { from?: Date; to?: Date }) => void;
  className?: string;
  placeholder?: string;
  ariaLabel?: string;
}

export const DateRangePicker = ({
  from,
  to,
  onChange,
  className,
  placeholder = "Choisir une période",
  ariaLabel = "Choisir une période",
}: DateRangePickerProps) => {
  const [open, setOpen] = React.useState(false);
  const [awaitingEnd, setAwaitingEnd] = React.useState(false);

  const label = from
    ? to && to.getTime() !== from.getTime()
      ? `${format(from, "d MMM", { locale: fr })} - ${format(to, "d MMM yyyy", { locale: fr })}`
      : format(from, "d MMMM yyyy", { locale: fr })
    : null;

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setAwaitingEnd(false);
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          aria-label={ariaLabel}
          className={cn(
            "h-11 w-full justify-start px-3.5 text-left font-normal",
            !from && "text-muted-foreground",
            className,
          )}
        >
          <CalendarIcon className="text-muted-foreground" />
          {label ?? <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          selected={{ from, to } as DateRange}
          defaultMonth={from}
          numberOfMonths={2}
          onSelect={(range) => {
            onChange({ from: range?.from, to: range?.to });

            if (!range?.from) {
              setAwaitingEnd(false);
              return;
            }

            if (awaitingEnd) {
              setAwaitingEnd(false);
              setOpen(false);
              return;
            }

            setAwaitingEnd(true);
          }}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  );
};
