import Image from "next/image"

import { cn, getAvatarColor, getInitial } from "@/lib/utils"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface WorkspaceAvatarProps {
    image?: string
    name?: string
    className?: string
    fallbackClassName?: string
}

export const WorkspaceAvatar = ({
    image,
    name,
    className,
    fallbackClassName,
}: WorkspaceAvatarProps) => {
    if (image) {
        return (
            <div className={cn(
                "size-10 relative shrink-0 rounded-md overflow-hidden border",
                className,
            )}>
                <Image src={image} alt={name ?? "Espace de travail"} fill className="object-cover" />
            </div>
        )
    }

    return (
        <Avatar className={cn(
            "size-10 rounded-md",
            className
        )}>
            <AvatarFallback className={cn(
                "rounded-md text-base font-semibold uppercase",
                getAvatarColor(name),
                fallbackClassName,
            )}>
                {getInitial(name)}
            </AvatarFallback>
        </Avatar>
    )
}
