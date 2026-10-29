import { LightbulbIcon, TriangleAlertIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Kbd } from "@/components/ui/kbd";

import { GUIDE_CHAPTERS } from "./chapters";

interface ChapterProps {
  id: string;
  children: React.ReactNode;
}

/** Un chapitre du guide, avec son numéro, son icône et son titre tirés du sommaire. */
export const Chapter = ({ id, children }: ChapterProps) => {
  const index = GUIDE_CHAPTERS.findIndex((chapter) => chapter.id === id);
  const { title, summary, icon: Icon } = GUIDE_CHAPTERS[index];

  return (
    <section
      id={id}
      className="scroll-mt-32 border-b py-14 first:pt-0 last:border-0 lg:scroll-mt-20"
    >
      <div className="flex items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-5" />
        </span>
        <div>
          <p className="text-xs font-medium text-primary">Chapitre {index + 1}</p>
          <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
        </div>
      </div>
      <p className="mt-3 text-muted-foreground">{summary}</p>
      <div className="mt-8 flex flex-col gap-10">{children}</div>
    </section>
  );
};

export const Part = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="flex flex-col gap-4">
    <h3 className="text-lg font-semibold">{title}</h3>
    {children}
  </div>
);

export const Text = ({ children }: { children: React.ReactNode }) => (
  <p className="leading-relaxed text-muted-foreground">{children}</p>
);

/** Étapes numérotées. */
export const Steps = ({ children }: { children: React.ReactNode[] }) => (
  <ol className="flex flex-col gap-3">
    {children.map((step, index) => (
      <li key={index} className="flex gap-3">
        <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border bg-background text-xs font-semibold">
          {index + 1}
        </span>
        <span className="leading-relaxed text-muted-foreground">{step}</span>
      </li>
    ))}
  </ol>
);

/** Liste à puces. */
export const Bullets = ({ children }: { children: React.ReactNode[] }) => (
  <ul className="flex flex-col gap-2">
    {children.map((item, index) => (
      <li key={index} className="flex gap-3 leading-relaxed text-muted-foreground">
        <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-primary/60" />
        <span>{item}</span>
      </li>
    ))}
  </ul>
);

/** Libellé tel qu'il apparaît dans l'interface. */
export const Ui = ({ children }: { children: React.ReactNode }) => (
  <span className="font-medium text-foreground">{children}</span>
);

/** Raccourci clavier : « ⌘K », ou plusieurs touches à la suite (G puis H). */
export const Keys = ({ k, then }: { k: string; then?: string }) => (
  <span className="inline-flex items-center gap-1 align-middle">
    <Kbd>{k}</Kbd>
    {then && (
      <>
        <span className="text-xs text-muted-foreground">puis</span>
        <Kbd>{then}</Kbd>
      </>
    )}
  </span>
);

export const Tip = ({
  children,
  tone = "tip",
}: {
  children: React.ReactNode;
  tone?: "tip" | "warning";
}) => {
  const Icon = tone === "tip" ? LightbulbIcon : TriangleAlertIcon;

  return (
    <div
      className={cn(
        "flex gap-3 rounded-lg border px-4 py-3 text-sm leading-relaxed",
        tone === "tip"
          ? "border-primary/20 bg-primary/5"
          : "border-amber-500/25 bg-amber-500/5 dark:border-amber-400/20",
      )}
    >
      <Icon
        className={cn(
          "mt-0.5 size-4 shrink-0",
          tone === "tip" ? "text-primary" : "text-amber-600 dark:text-amber-400",
        )}
      />
      <div>
        <span className="font-medium">{tone === "tip" ? "Astuce : " : "Bon à savoir : "}</span>
        <span className="text-muted-foreground">{children}</span>
      </div>
    </div>
  );
};

/** Tableau simple à deux colonnes ou plus. */
export const Table = ({ head, rows }: { head: string[]; rows: React.ReactNode[][] }) => (
  <div className="overflow-x-auto rounded-lg border">
    <table className="w-full text-sm">
      <thead className="bg-muted/50">
        <tr>
          {head.map((cell) => (
            <th key={cell} className="px-4 py-2.5 text-left font-medium">
              {cell}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, index) => (
          <tr key={index} className="border-t">
            {row.map((cell, position) => (
              <td
                key={position}
                className={cn(
                  "px-4 py-2.5 align-top",
                  position > 0 ? "text-muted-foreground" : "font-medium whitespace-nowrap",
                )}
              >
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

/** Cadre autour d'un aperçu de l'interface. */
export const Preview = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    aria-hidden
    className={cn("overflow-hidden rounded-xl border bg-muted/30 p-4 sm:p-6", className)}
  >
    {children}
  </div>
);
