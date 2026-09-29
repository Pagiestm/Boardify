import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { TaskStatus, TaskPriority } from "@/features/tasks/types"
import { TASK_PRIORITY_CONFIG, TASK_STATUS_CONFIG } from "@/features/tasks/constants"

import { cn } from "@/lib/utils"

const taskVariants = Object.fromEntries([
  ...Object.values(TaskStatus).map((status) => [status, TASK_STATUS_CONFIG[status].badge]),
  ...Object.values(TaskPriority).map((priority) => [priority, TASK_PRIORITY_CONFIG[priority].badge]),
]) as Record<TaskStatus | TaskPriority, string>

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-medium [&_svg]:size-3",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        secondary: "bg-secondary text-secondary-foreground",
        destructive: "bg-destructive/10 text-destructive",
        outline: "border text-foreground",
        soft: "bg-primary/10 text-primary",
        ...taskVariants,
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const dotClasses = Object.fromEntries([
  ...Object.values(TaskStatus).map((status) => [status, TASK_STATUS_CONFIG[status].dot]),
  ...Object.values(TaskPriority).map((priority) => [priority, TASK_PRIORITY_CONFIG[priority].dot]),
]) as Record<string, string>

export interface BadgeProps
  extends React.ComponentProps<"span">,
    VariantProps<typeof badgeVariants> {
  /** Leading colored dot */
  dot?: boolean
}

function Badge({ className, variant, dot, children, ...props }: BadgeProps) {
  const dotClass = variant ? dotClasses[variant] : undefined

  return (
    <span data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props}>
      {dot && dotClass && <span aria-hidden className={cn("size-1.5 rounded-full", dotClass)} />}
      {children}
    </span>
  )
}

export { Badge, badgeVariants }
