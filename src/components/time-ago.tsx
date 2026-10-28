"use client";

import { format, formatDistanceToNowStrict } from "date-fns";
import { fr } from "date-fns/locale";

interface TimeAgoProps {
  date: string;
  className?: string;
}

export const TimeAgo = ({ date, className }: TimeAgoProps) => {
  const value = new Date(date);

  return (
    <time
      dateTime={date}
      title={format(value, "d MMMM yyyy 'à' HH:mm", { locale: fr })}
      className={className}
    >
      il y a {formatDistanceToNowStrict(value, { locale: fr })}
    </time>
  );
};
