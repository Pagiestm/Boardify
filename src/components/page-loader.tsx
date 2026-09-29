import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";

interface PageLoaderProps {
    className?: string;
    label?: string;
}

export const PageLoader = ({ className, label }: PageLoaderProps) => {
    return (
        <div
            aria-live="polite"
            className={cn("flex min-h-[60vh] flex-1 flex-col items-center justify-center gap-3", className)}
        >
            <Spinner className="size-6" />
            {label && <p className="text-sm text-muted-foreground">{label}</p>}
        </div>
    )
}
