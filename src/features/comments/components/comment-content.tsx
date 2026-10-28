import { splitMentions } from "../mentions";

export const CommentContent = ({ content }: { content: string }) => (
  <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">
    {splitMentions(content).map((part, index) =>
      part.type === "mention" ? (
        <span key={index} className="rounded bg-primary/10 px-1 font-medium text-primary">
          @{part.name}
        </span>
      ) : (
        <span key={index}>{part.text}</span>
      ),
    )}
  </p>
);
