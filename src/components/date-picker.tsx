"use client"

import * as React from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

interface DatePickerProps {
    value: Date | undefined;
    onChange: (date: Date) => void;
    className?: string;
    placeholder?: string;
}

export const DatePicker = ({ value, onChange, className, placeholder = "Choisir une date" }: DatePickerProps) => {
    const [open, setOpen] = React.useState(false);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className={cn(
                        "h-11 w-full justify-start px-3.5 text-left font-normal",
                        !value && "text-muted-foreground",
                        className
                    )}
                >
                    <CalendarIcon className="text-muted-foreground" />
                    {value ? format(value, "d MMMM yyyy", { locale: fr }) : <span>{placeholder}</span>}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    mode="single"
                    selected={value}
                    defaultMonth={value}
                    onSelect={(date) => {
                        if (date) {
                            onChange(date);
                            setOpen(false);
                        }
                    }}
                    autoFocus
                />
            </PopoverContent>
        </Popover>
    )
}
