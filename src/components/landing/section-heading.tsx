import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  eyebrow: string;
  title: string;
  description?: string;
  className?: string;
}

export const SectionHeading = ({ eyebrow, title, description, className }: SectionHeadingProps) => {
  return (
    <div className={cn("mx-auto max-w-2xl text-center", className)}>
      <p className="text-sm font-medium text-primary">{eyebrow}</p>
      <h2 className="mt-2 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
        {title}
      </h2>
      {description && (
        <p className="mt-4 text-base text-balance text-muted-foreground">{description}</p>
      )}
    </div>
  );
};
