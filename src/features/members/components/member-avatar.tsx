import { cn, getAvatarColor, getInitial } from "@/lib/utils";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface MemberAvatarProps {
  name?: string;
  /** Photo de profil ; à défaut, l'initiale du nom. */
  image?: string | null;
  className?: string;
  fallbackClassName?: string;
}

export const MemberAvatar = ({ name, image, className, fallbackClassName }: MemberAvatarProps) => {
  return (
    <Avatar className={cn("size-5 rounded-full", className)}>
      {image && <AvatarImage src={image} alt={name ?? ""} className="object-cover" />}
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
