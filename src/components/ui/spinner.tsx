import { Loader2Icon } from "lucide-react";

import { cn } from "@/lib/utils";

function Spinner({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <Loader2Icon
      role="status"
      aria-label="Chargement"
      className={cn("size-4 animate-spin text-muted-foreground", className)}
      {...props}
    />
  );
}

export { Spinner };
