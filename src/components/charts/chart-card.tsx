"use client";

import { useId } from "react";

import { cn } from "@/lib/utils";

interface ChartCardProps {
  title: string;
  description?: string;
  isEmpty?: boolean;
  emptyLabel?: string;
  className?: string;
  children: React.ReactNode;
}

export const ChartCard = ({
  title,
  description,
  isEmpty = false,
  emptyLabel = "Aucune donnée à afficher",
  className,
  children,
}: ChartCardProps) => {
  const titleId = useId();

  return (
    <section
      aria-labelledby={titleId}
      className={cn("rounded-lg border bg-card p-5 shadow-xs", className)}
    >
      <header className="mb-4">
        <h3 id={titleId} className="text-sm font-semibold text-foreground">
          {title}
        </h3>
        {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
      </header>
      {isEmpty ? (
        <p className="py-6 text-center text-sm text-muted-foreground">{emptyLabel}</p>
      ) : (
        children
      )}
    </section>
  );
};
