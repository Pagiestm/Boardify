"use client";

import { useRef, useState } from "react";
import { SparklesIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { MemberAvatar } from "@/features/members/components/member-avatar";

import { formatMention, splitMentions } from "../mentions";

export interface MentionableMember {
  id: string;
  name: string;
}

interface CommentComposerProps {
  members: MentionableMember[];
  initialContent?: string;
  submitLabel: string;
  isPending?: boolean;
  autoFocus?: boolean;
  onSubmit: (content: string) => void;
  onCancel?: () => void;
  /** Assistant IA : renvoie une proposition de réponse à placer dans le champ. */
  onSuggest?: () => Promise<string | null>;
}

const MENTION_QUERY = /(?:^|\s)@([^\s@]{0,30})$/;

const toEditable = (content: string) => {
  const mentions: MentionableMember[] = [];
  const text = splitMentions(content)
    .map((part) => {
      if (part.type === "text") return part.text;
      mentions.push({ id: part.memberId, name: part.name });
      return `@${part.name}`;
    })
    .join("");

  return { text, mentions };
};

const toContent = (text: string, mentions: MentionableMember[]) =>
  [...mentions]
    .sort((a, b) => b.name.length - a.name.length)
    .reduce(
      (content, { id, name }) => content.split(`@${name}`).join(formatMention(name, id)),
      text,
    )
    .trim();

export const CommentComposer = ({
  members,
  initialContent = "",
  submitLabel,
  isPending,
  autoFocus,
  onSubmit,
  onCancel,
  onSuggest,
}: CommentComposerProps) => {
  const [isSuggesting, setIsSuggesting] = useState(false);
  const initial = toEditable(initialContent);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [text, setText] = useState(initial.text);
  const [mentions, setMentions] = useState<MentionableMember[]>(initial.mentions);
  const [query, setQuery] = useState<string | null>(null);
  const [highlighted, setHighlighted] = useState(0);

  const suggestions =
    query === null
      ? []
      : members
          .filter((member) => member.name.toLowerCase().includes(query.toLowerCase()))
          .slice(0, 6);

  const updateQuery = (value: string, caret: number) => {
    const match = MENTION_QUERY.exec(value.slice(0, caret));
    setQuery(match ? match[1] : null);
    setHighlighted(0);
  };

  const insertMention = (member: MentionableMember) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const caret = textarea.selectionStart;
    const before = text.slice(0, caret).replace(/@[^\s@]*$/, `@${member.name} `);
    const next = before + text.slice(caret);

    setText(next);
    setMentions((current) =>
      current.some((item) => item.id === member.id) ? current : [...current, member],
    );
    setQuery(null);

    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(before.length, before.length);
    });
  };

  const submit = () => {
    const content = toContent(text, mentions);
    if (!content || isPending) return;

    onSubmit(content);
    if (!initialContent) {
      setText("");
      setMentions([]);
    }
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (suggestions.length > 0) {
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        const step = event.key === "ArrowDown" ? 1 : -1;
        setHighlighted((index) => (index + step + suggestions.length) % suggestions.length);
        return;
      }
      if (event.key === "Enter" || event.key === "Tab") {
        event.preventDefault();
        insertMention(suggestions[highlighted]);
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        setQuery(null);
        return;
      }
    }

    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      submit();
    }
    if (event.key === "Escape" && onCancel) onCancel();
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <Textarea
          ref={textareaRef}
          value={text}
          rows={3}
          autoFocus={autoFocus}
          placeholder="Écrire un commentaire… (@ pour mentionner, ⌘↵ pour envoyer)"
          onChange={(event) => {
            setText(event.target.value);
            updateQuery(event.target.value, event.target.selectionStart);
          }}
          onKeyDown={onKeyDown}
          onBlur={() => setTimeout(() => setQuery(null), 150)}
        />
        {suggestions.length > 0 && (
          <ul
            role="listbox"
            className="absolute top-full left-0 z-20 mt-1 w-64 overflow-hidden rounded-md border bg-popover p-1 shadow-md"
          >
            {suggestions.map((member, index) => (
              <li
                key={member.id}
                role="option"
                aria-selected={index === highlighted}
                onMouseDown={(event) => {
                  event.preventDefault();
                  insertMention(member);
                }}
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm",
                  index === highlighted && "bg-accent",
                )}
              >
                <MemberAvatar name={member.name} />
                {member.name}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="flex justify-end gap-2">
        {onSuggest && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mr-auto"
            disabled={isSuggesting || isPending}
            onClick={async () => {
              setIsSuggesting(true);
              try {
                const suggestion = await onSuggest();
                if (suggestion) setText(suggestion);
              } finally {
                setIsSuggesting(false);
              }
            }}
          >
            {isSuggesting ? <Spinner className="text-current" /> : <SparklesIcon />}
            Suggérer une réponse
          </Button>
        )}
        {onCancel && (
          <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={isPending}>
            Annuler
          </Button>
        )}
        <Button type="button" size="sm" onClick={submit} disabled={isPending || !text.trim()}>
          {isPending && <Spinner className="text-primary-foreground" />}
          {submitLabel}
        </Button>
      </div>
    </div>
  );
};
