import { cn } from "@/lib/utils";

interface DottedSeparatorProps {
    className?: string;
    color?: string;
    height?: string;
    dotSize?: string;
    gapSize?: string;
    direction?: "horizontal" | "vertical";
}

/**
 * Thin separator line. Kept under its historical name/props so existing call
 * sites don't change; `dotSize`/`gapSize` are accepted but the line is solid.
 */
export const DottedSeparator = ({
    className,
    color,
    height = "1px",
    direction = "horizontal",
}: DottedSeparatorProps) => {
    const isHorizontal = direction === "horizontal";

    return (
        <div
            aria-hidden
            className={cn(
                "shrink-0 bg-border",
                isHorizontal ? "w-full" : "h-full self-stretch",
                className,
            )}
            style={{
                width: isHorizontal ? "100%" : height,
                height: isHorizontal ? height : "100%",
                backgroundColor: color,
            }}
        />
    )
}
