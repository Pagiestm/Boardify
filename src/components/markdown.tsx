import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

import { cn } from "@/lib/utils";

/** Mise en forme des éléments Markdown, alignée sur le reste de l'interface. */
const COMPONENTS: Components = {
  h1: ({ children }) => (
    <h3 className="mt-4 mb-2 text-base font-semibold first:mt-0">{children}</h3>
  ),
  h2: ({ children }) => <h4 className="mt-4 mb-2 text-sm font-semibold first:mt-0">{children}</h4>,
  h3: ({ children }) => (
    <h5 className="mt-3 mb-1.5 text-sm font-semibold first:mt-0">{children}</h5>
  ),
  p: ({ children }) => <p className="my-2 leading-relaxed first:mt-0 last:mb-0">{children}</p>,
  ul: ({ children, className }) => (
    <ul
      className={cn(
        "my-2 flex flex-col gap-1 pl-5",
        className?.includes("contains-task-list") ? "list-none pl-1" : "list-disc",
      )}
    >
      {children}
    </ul>
  ),
  ol: ({ children }) => <ol className="my-2 flex list-decimal flex-col gap-1 pl-5">{children}</ol>,
  li: ({ children, className }) => (
    <li className={cn("leading-relaxed", className?.includes("task-list-item") && "flex gap-2")}>
      {children}
    </li>
  ),
  input: ({ checked }) => (
    <input
      type="checkbox"
      checked={Boolean(checked)}
      readOnly
      disabled
      className="mt-1 size-3.5 shrink-0 accent-primary"
    />
  ),
  a: ({ children, href }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="font-medium text-primary underline underline-offset-4"
    >
      {children}
    </a>
  ),
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  blockquote: ({ children }) => (
    <blockquote className="my-2 border-l-2 pl-3 text-muted-foreground">{children}</blockquote>
  ),
  hr: () => <hr className="my-4" />,
  code: ({ children, className }) =>
    className?.startsWith("language-") ? (
      <code className={className}>{children}</code>
    ) : (
      <code className="rounded bg-muted px-1 py-0.5 font-mono text-[0.85em]">{children}</code>
    ),
  pre: ({ children }) => (
    <pre className="my-2 overflow-x-auto rounded-md bg-muted p-3 font-mono text-xs leading-relaxed">
      {children}
    </pre>
  ),
  table: ({ children }) => (
    <div className="my-2 overflow-x-auto rounded-md border">
      <table className="w-full text-xs">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border-b bg-muted/50 px-2 py-1.5 text-left font-medium">{children}</th>
  ),
  td: ({ children }) => <td className="border-b px-2 py-1.5">{children}</td>,
};

interface MarkdownProps {
  children: string;
  className?: string;
}

/** Texte Markdown mis en forme (le HTML brut n'est jamais interprété). */
export const Markdown = ({ children, className }: MarkdownProps) => (
  <div className={cn("text-sm break-words", className)}>
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={COMPONENTS}>
      {children}
    </ReactMarkdown>
  </div>
);
