"use client";

import * as React from "react";
import * as SeparatorPrimitive from "@radix-ui/react-separator";

import { cn } from "@/lib/utils";

function Separator({
  className,
  orientation = "horizontal",
  decorative = true,
  dashed = false,
  ...props
}: React.ComponentProps<typeof SeparatorPrimitive.Root> & { dashed?: boolean }) {
  return (
    <SeparatorPrimitive.Root
      data-slot="separator"
      decorative={decorative}
      orientation={orientation}
      className={cn(
        "shrink-0",
        dashed
          ? orientation === "horizontal"
            ? "h-0 w-full border-t border-dashed"
            : "h-full w-0 border-l border-dashed"
          : orientation === "horizontal"
            ? "h-px w-full bg-border"
            : "h-full w-px bg-border",
        className,
      )}
      {...props}
    />
  );
}

export { Separator };
