import { cn } from "@/lib/utils";

import { Label } from "../types";
import { LABEL_COLOR_CONFIG } from "../constants";

interface LabelBadgeProps {
  label: Label;
  className?: string;
}

export const LabelBadge = ({ label, className }: LabelBadgeProps) => {
  const config = LABEL_COLOR_CONFIG[label.color] ?? LABEL_COLOR_CONFIG.teal;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-[11px] font-medium",
        config.badge,
        className,
      )}
    >
      <span aria-hidden className={cn("size-1.5 rounded-full", config.dot)} />
      {label.name}
    </span>
  );
};
