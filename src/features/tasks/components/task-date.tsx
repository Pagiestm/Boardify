import { differenceInCalendarDays, format } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";

interface TaskDateProps {
  value?: string;
  className?: string;
  showIcon?: boolean;
  muted?: boolean;
  variant?: "short" | "long" | "full";
}

export const getRelativeDay = (diffInDays: number) => {
  if (diffInDays === 0) return "aujourd'hui";
  if (diffInDays === 1) return "demain";
  if (diffInDays === -1) return "hier";
  if (diffInDays > 0) return `dans ${diffInDays} j`;
  return `il y a ${Math.abs(diffInDays)} j`;
};

const FORMATS = {
  short: "d MMM",
  long: "d MMM yyyy",
  full: "d MMM yyyy",
} as const;

export const TaskDate = ({
  value,
  className,
  showIcon = false,
  muted = false,
  variant = "long",
}: TaskDateProps) => {
  const endDate = value ? new Date(value) : null;

  if (!endDate || Number.isNaN(endDate.getTime())) {
    return <span className={cn("text-muted-foreground", className)}>-</span>;
  }

  const diffInDays = differenceInCalendarDays(endDate, new Date());

  let tone = "text-muted-foreground";
  let flag: string | undefined;
  if (!muted) {
    if (diffInDays < 0) {
      tone = "text-red-600 dark:text-red-400";
      flag = "en retard";
    } else if (diffInDays <= 1) {
      tone = "text-red-600 dark:text-red-400";
    } else if (diffInDays <= 3) {
      tone = "text-amber-600 dark:text-amber-400";
    }
  }

  const relative = getRelativeDay(diffInDays);

  return (
    <span
      title={flag ? `${relative} - ${flag}` : relative}
      className={cn("inline-flex items-center gap-1 truncate tabular-nums", tone, className)}
    >
      {showIcon && <CalendarIcon aria-hidden className="size-3.5 shrink-0" />}
      <span className="truncate">
        {format(endDate, FORMATS[variant], { locale: fr })}
        {variant === "full" && <span className="opacity-80"> ({relative})</span>}
      </span>
      {flag && <span className="sr-only">, {flag}</span>}
    </span>
  );
};
