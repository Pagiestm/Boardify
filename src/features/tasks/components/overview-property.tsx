interface OverviewPropertyProps {
  label: string;
  children: React.ReactNode;
}

export const OverviewProperty = ({ label, children }: OverviewPropertyProps) => {
  return (
    <div className="grid grid-cols-[6.5rem_minmax(0,1fr)] items-center gap-x-3 py-2.5 text-sm">
      <dt className="truncate text-muted-foreground">{label}</dt>
      <dd className="flex min-w-0 items-center gap-x-2">{children}</dd>
    </div>
  );
};
