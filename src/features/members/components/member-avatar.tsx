import { cn, getAvatarColor, getInitial } from "@/lib/utils";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface MemberAvatarProps {
  name?: string;
  className?: string;
  fallbackClassName?: string;
}

export const MemberAvatar = ({ name, className, fallbackClassName }: MemberAvatarProps) => {
  return (
    <Avatar className={cn("size-5 rounded-full", className)}>
      <AvatarFallback
        title={name}
        className={cn(
          "rounded-full text-[10px] font-semibold",
          getAvatarColor(name),
          fallbackClassName,
        )}
      >
        {getInitial(name)}
      </AvatarFallback>
    </Avatar>
  );
};
