import Image from "next/image"

import { cn, getAvatarColor, getInitial } from "@/lib/utils"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface ProjectAvatarProps {
    image?: string
    name?: string
    className?: string
    fallbackClassName?: string
}

export const ProjectAvatar = ({
    image,
    name,
    className,
    fallbackClassName,
}: ProjectAvatarProps) => {
    if (image) {
        return (
            <div className={cn(
                "size-5 relative shrink-0 rounded-md overflow-hidden border",
                className,
            )}>
                <Image src={image} alt={name ?? "Projet"} fill className="object-cover" />
            </div>
        )
    }

    return (
        <Avatar className={cn(
            "size-5 rounded-md",
            className
        )}>
            <AvatarFallback className={cn(
                "rounded-md text-[11px] font-semibold uppercase",
                getAvatarColor(name),
                fallbackClassName,
            )}>
                {getInitial(name)}
            </AvatarFallback>
        </Avatar>
    )
}
