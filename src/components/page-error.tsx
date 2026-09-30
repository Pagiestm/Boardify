import { AlertTriangleIcon } from "lucide-react";

import { cn } from "@/lib/utils";

interface PageErrorProps {
  message?: string;
  description?: string;
  className?: string;
  children?: React.ReactNode;
}

export const PageError = ({
  message = "Une erreur est survenue",
  description = "Réessayez dans un instant. Si le problème persiste, rechargez la page.",
  className,
  children,
}: PageErrorProps) => {
  return (
    <div className={cn("flex min-h-[60vh] flex-1 items-center justify-center px-4", className)}>
      <div role="alert" className="flex max-w-sm flex-col items-center text-center">
        <div className="mb-4 flex size-10 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangleIcon className="size-5 text-destructive" />
        </div>
        <p className="text-base font-semibold">{message}</p>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        {children && (
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">{children}</div>
        )}
      </div>
    </div>
  );
};
