const MENTION_PATTERN = /@\[([^\]]+)\]\(([^)\s]+)\)/g;

export const formatMention = (name: string, memberId: string) =>
  `@[${name.replace(/[[\]]/g, "")}](${memberId})`;

export const extractMentionIds = (content: string) => [
  ...new Set([...content.matchAll(MENTION_PATTERN)].map((match) => match[2])),
];

export type CommentPart =
  { type: "text"; text: string } | { type: "mention"; name: string; memberId: string };

export const splitMentions = (content: string): CommentPart[] => {
  const parts: CommentPart[] = [];
  let lastIndex = 0;

  for (const match of content.matchAll(MENTION_PATTERN)) {
    if (match.index > lastIndex) {
      parts.push({ type: "text", text: content.slice(lastIndex, match.index) });
    }
    parts.push({ type: "mention", name: match[1], memberId: match[2] });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) parts.push({ type: "text", text: content.slice(lastIndex) });
  return parts;
};

export const replaceMentions = (
  content: string,
  render: (name: string, memberId: string) => string,
) =>
  content.replace(MENTION_PATTERN, (_, name: string, memberId: string) => render(name, memberId));
