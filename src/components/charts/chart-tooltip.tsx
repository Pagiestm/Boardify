"use client";

interface ChartTooltipProps {
  active?: boolean;
  payload?: { value?: number; name?: string; payload?: { label?: string } }[];
  label?: string;
}

export const ChartTooltip = ({ active, payload, label }: ChartTooltipProps) => {
  if (!active || !payload?.length) return null;

  const entry = payload[0];
  const title = entry.payload?.label ?? label;

  return (
    <div className="rounded-md border bg-popover px-2.5 py-1.5 text-xs shadow-md">
      <p className="font-medium text-popover-foreground">{title}</p>
      <p className="text-muted-foreground">
        {entry.value} tâche{(entry.value ?? 0) > 1 ? "s" : ""}
      </p>
    </div>
  );
};
