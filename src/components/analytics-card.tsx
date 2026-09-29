import { ArrowDownIcon, ArrowUpIcon, MinusIcon, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

interface AnalyticsCardProps {
    title: string;
    value: number;
    variant: "up" | "down";
    increaseValue: number;
    icon?: LucideIcon;
    /** When true, an increase is bad news (e.g. overdue tasks). */
    inverse?: boolean;
    className?: string;
}

export const AnalyticsCard = ({
    title,
    value,
    variant,
    increaseValue,
    icon: Icon,
    inverse = false,
    className,
}: AnalyticsCardProps) => {
    const isNeutral = increaseValue === 0;
    const isGood = inverse ? variant === "down" : variant === "up";
    const TrendIcon = isNeutral ? MinusIcon : variant === "up" ? ArrowUpIcon : ArrowDownIcon;

    return (
        <div className={cn("flex min-w-[160px] flex-1 flex-col gap-2 rounded-lg border bg-card p-4 shadow-xs", className)}>
            <div className="flex items-center justify-between gap-2">
                <p className="truncate text-sm text-muted-foreground">{title}</p>
                {Icon && <Icon className="size-4 text-muted-foreground" />}
            </div>
            <div className="flex items-end justify-between gap-2">
                <p className="text-2xl font-semibold tabular-nums">{value}</p>
                <span
                    title="Évolution par rapport au mois dernier"
                    className={cn(
                        "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-xs font-medium tabular-nums",
                        isNeutral && "bg-muted text-muted-foreground",
                        !isNeutral && isGood && "bg-green-50 text-green-700 dark:bg-green-500/15 dark:text-green-300",
                        !isNeutral && !isGood && "bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300",
                    )}
                >
                    <TrendIcon className="size-3" />
                    {increaseValue > 0 ? `+${increaseValue}` : increaseValue}
                </span>
            </div>
        </div>
    )
}
