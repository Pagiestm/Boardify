"use client";

import { useRef, useState } from "react";
import {
  BoldIcon,
  CodeIcon,
  HeadingIcon,
  ItalicIcon,
  LinkIcon,
  ListChecksIcon,
  ListIcon,
  ListOrderedIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";

import { Markdown } from "./markdown";

type Format = { prefix: string; suffix?: string; line?: boolean; placeholder: string };

const ACTIONS: {
  label: string;
  shortcut?: string;
  icon: React.ComponentType<{ className?: string }>;
  format: Format;
}[] = [
  {
    label: "Gras",
    shortcut: "b",
    icon: BoldIcon,
    format: { prefix: "**", suffix: "**", placeholder: "texte en gras" },
  },
  {
    label: "Italique",
    shortcut: "i",
    icon: ItalicIcon,
    format: { prefix: "_", suffix: "_", placeholder: "texte en italique" },
  },
  {
    label: "Titre",
    icon: HeadingIcon,
    format: { prefix: "### ", line: true, placeholder: "Titre" },
  },
  { label: "Liste", icon: ListIcon, format: { prefix: "- ", line: true, placeholder: "élément" } },
  {
    label: "Liste numérotée",
    icon: ListOrderedIcon,
    format: { prefix: "1. ", line: true, placeholder: "élément" },
  },
  {
    label: "Liste à cocher",
    icon: ListChecksIcon,
    format: { prefix: "- [ ] ", line: true, placeholder: "à faire" },
  },
  { label: "Code", icon: CodeIcon, format: { prefix: "`", suffix: "`", placeholder: "code" } },
  {
    label: "Lien",
    icon: LinkIcon,
    format: { prefix: "[", suffix: "](https://)", placeholder: "texte du lien" },
  },
];

interface MarkdownEditorProps extends Omit<
  React.ComponentProps<typeof Textarea>,
  "value" | "onChange"
> {
  value: string;
  onChange: (value: string) => void;
}

/** Zone de texte Markdown avec barre de mise en forme et aperçu. */
export const MarkdownEditor = ({
  value,
  onChange,
  className,
  onKeyDown,
  disabled,
  ref,
  ...props
}: MarkdownEditorProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // La zone de texte est gardée pour la mise en forme, tout en servant la ref reçue (formulaires).
  const setTextarea = (node: HTMLTextAreaElement | null) => {
    textareaRef.current = node;
    if (typeof ref === "function") ref(node);
    else if (ref) ref.current = node;
  };
  const [preview, setPreview] = useState(false);

  // Applique la mise en forme à la sélection (ou insère un exemple), puis garde le focus.
  const apply = ({ prefix, suffix = "", line, placeholder }: Format) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const { selectionStart: start, selectionEnd: end } = textarea;
    const selected = value.slice(start, end) || placeholder;

    let before = value.slice(0, start);
    if (line && before && !before.endsWith("\n")) before += "\n";
    const inserted = line
      ? selected
          .split("\n")
          .map((row) => `${prefix}${row}`)
          .join("\n")
      : `${prefix}${selected}${suffix}`;
    const next = before + inserted + value.slice(end);
    onChange(next);

    const selectionStart = before.length + (line ? prefix.length : prefix.length);
    const selectionEnd =
      selectionStart + (line ? inserted.length - prefix.length : selected.length);
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(selectionStart, selectionEnd);
    });
  };

  return (
    <div
      className={cn(
        "overflow-hidden rounded-md border bg-background focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/30",
        disabled && "opacity-60",
      )}
    >
      <div className="flex items-center gap-0.5 border-b px-1.5 py-1">
        {(["Écrire", "Aperçu"] as const).map((tab) => {
          const active = (tab === "Aperçu") === preview;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setPreview(tab === "Aperçu")}
              className={cn(
                "rounded px-2 py-1 text-xs font-medium transition-colors",
                active ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {tab}
            </button>
          );
        })}
        <span className="mx-1 h-4 w-px bg-border" />
        <div className="flex min-w-0 flex-1 [scrollbar-width:none] items-center gap-0.5 overflow-x-auto">
          {ACTIONS.map(({ label, shortcut, icon: Icon, format }) => (
            <button
              key={label}
              type="button"
              title={shortcut ? `${label} (⌘${shortcut.toUpperCase()})` : label}
              aria-label={label}
              disabled={preview || disabled}
              onClick={() => apply(format)}
              className="flex size-7 shrink-0 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
            >
              <Icon className="size-3.5" />
            </button>
          ))}
        </div>
      </div>
      {preview ? (
        <div className="min-h-24 px-3 py-2.5">
          {value.trim() ? (
            <Markdown>{value}</Markdown>
          ) : (
            <p className="text-sm text-muted-foreground">Rien à afficher pour le moment.</p>
          )}
        </div>
      ) : (
        <Textarea
          ref={setTextarea}
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            const action = ACTIONS.find(
              (item) => item.shortcut && item.shortcut === event.key.toLowerCase(),
            );
            if (action && (event.metaKey || event.ctrlKey) && !event.shiftKey) {
              event.preventDefault();
              apply(action.format);
              return;
            }
            onKeyDown?.(event);
          }}
          className={cn("rounded-none border-0 shadow-none focus-visible:ring-0", className)}
          {...props}
        />
      )}
      <p className="border-t px-3 py-1.5 text-[11px] text-muted-foreground">
        Markdown accepté : **gras**, _italique_, listes, - [ ] cases à cocher, [liens](https://…)
      </p>
    </div>
  );
};
