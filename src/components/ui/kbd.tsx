import * as React from "react"

import { cn } from "@/lib/utils"

/** Keyboard key hint, e.g. <Kbd>N</Kbd> or <Kbd>⌘K</Kbd>. */
function Kbd({ className, ...props }: React.ComponentProps<"kbd">) {
  return (
    <kbd
      data-slot="kbd"
      className={cn(
        "pointer-events-none inline-flex h-5 min-w-5 items-center justify-center gap-1 rounded border bg-muted px-1 font-sans text-[11px] font-medium text-muted-foreground select-none",
        className
      )}
      {...props}
    />
  )
}

export { Kbd }
