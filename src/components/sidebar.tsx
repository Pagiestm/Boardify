import Image from "next/image"
import Link from "next/link"

import { Projects } from "./projects"
import { Navigation } from "./navigation"
import { DottedSeparator } from "./dotted-separator"
import { WorkspaceSwitcher } from "./workspace-switcher"

export const Sidebar = () => {
    return (
        <aside className="h-full bg-neutral-100 dark:bg-background p-4 w-full">
            <Link href="/" className="flex items-center">
                <Image src="/logo.svg" alt="logo" className="dark:invert" width={48} height={48} />
                <span className="ml-2 text-2xl font-bold">Boardify</span>
            </Link>
            <DottedSeparator className="my-4" />
            <WorkspaceSwitcher />
            <DottedSeparator className="my-4" />
            <Navigation />
            <DottedSeparator className="my-4" />
            <Projects />
        </aside>
    )
}