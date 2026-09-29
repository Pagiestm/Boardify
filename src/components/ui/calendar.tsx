"use client"

import * as React from "react"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import { DayPicker, getDefaultClassNames } from "react-day-picker"
import { fr } from "react-day-picker/locale"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  const defaults = getDefaultClassNames()

  return (
    <DayPicker
      locale={fr}
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        root: cn("w-fit", defaults.root),
        months: "relative flex flex-col gap-4 sm:flex-row",
        month: "flex w-full flex-col gap-4",
        nav: "absolute inset-x-0 top-0 flex w-full items-center justify-between gap-1",
        button_previous: cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), "size-8 p-0 aria-disabled:opacity-40"),
        button_next: cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), "size-8 p-0 aria-disabled:opacity-40"),
        month_caption: "flex h-8 items-center justify-center px-8",
        caption_label: "text-sm font-semibold capitalize",
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday: "flex-1 select-none text-[0.75rem] font-medium text-muted-foreground capitalize",
        week: "mt-1.5 flex w-full",
        day: "group/day relative aspect-square size-9 p-0 text-center text-sm select-none",
        day_button: cn(
          "inline-flex size-9 items-center justify-center rounded-md font-normal transition-colors outline-none",
          "hover:bg-accent hover:text-accent-foreground"
        ),
        selected:
          "[&>button]:bg-primary [&>button]:font-semibold [&>button]:text-primary-foreground [&>button]:hover:bg-primary",
        today: "[&>button]:font-semibold [&>button]:text-primary [&>button]:ring-1 [&>button]:ring-primary/30",
        outside: "text-muted-foreground/50",
        disabled: "text-muted-foreground opacity-50",
        hidden: "invisible",
        range_start: "rounded-md bg-accent",
        range_middle: "bg-accent [&>button]:rounded-md",
        range_end: "rounded-md bg-accent",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, className: chevronClassName, ...chevronProps }) =>
          orientation === "left" ? (
            <ChevronLeftIcon className={cn("size-4", chevronClassName)} {...chevronProps} />
          ) : (
            <ChevronRightIcon className={cn("size-4", chevronClassName)} {...chevronProps} />
          ),
      }}
      {...props}
    />
  )
}

export { Calendar }
