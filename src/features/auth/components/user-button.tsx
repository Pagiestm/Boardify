"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import {
  BookOpenIcon,
  CompassIcon,
  KeyboardIcon,
  LogOutIcon,
  SearchIcon,
  UserRoundIcon,
} from "lucide-react";

import { findTour } from "@/features/onboarding/tours";
import { startTour } from "@/features/onboarding/store";
import { MemberAvatar } from "@/features/members/components/member-avatar";

import { avatarUrl } from "@/lib/avatar";
import { Kbd } from "@/components/ui/kbd";
import { Skeleton } from "@/components/ui/skeleton";
import { useShortcutsHelp } from "@/components/shortcuts-help";
import { useCommandPalette } from "@/components/command-palette";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useLogout } from "../api/use-logout";
import { useCurrent } from "../api/use-current";

export const UserButton = () => {
  const { mutate: logout, isPending } = useLogout();
  const { data: user, isLoading } = useCurrent();
  const palette = useCommandPalette();
  const help = useShortcutsHelp();
  const tour = findTour(usePathname());
  const { workspaceId } = useParams<{ workspaceId?: string }>();

  if (isLoading) {
    return <Skeleton className="size-8 rounded-full" />;
  }

  if (!user) {
    return null;
  }

  const { name, email } = user;
  const displayName = name || email;
  const image = avatarUrl(user.$id, (user.prefs as Record<string, unknown>)?.avatarId);

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger
        data-tour="user-menu"
        aria-label="Menu du compte"
        className="rounded-full transition-opacity outline-none hover:opacity-85 focus-visible:ring-[3px] focus-visible:ring-ring/40"
      >
        <MemberAvatar
          name={displayName}
          image={image}
          className="size-8"
          fallbackClassName="text-xs"
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="bottom" className="w-60" sideOffset={8}>
        <div className="flex items-center gap-3 px-2 py-2">
          <MemberAvatar
            name={displayName}
            image={image}
            className="size-9 shrink-0"
            fallbackClassName="text-sm"
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{name || "Utilisateur"}</p>
            <p className="truncate text-xs text-muted-foreground">{email}</p>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={workspaceId ? `/workspaces/${workspaceId}/account` : "/account"}>
            <UserRoundIcon className="text-muted-foreground" />
            Mon compte
          </Link>
        </DropdownMenuItem>
        {palette.available && (
          <>
            <DropdownMenuItem onSelect={palette.open}>
              <SearchIcon className="text-muted-foreground" />
              <span className="flex-1">Rechercher</span>
              <Kbd>⌘K</Kbd>
            </DropdownMenuItem>
            {help.available && (
              <DropdownMenuItem onSelect={help.open}>
                <KeyboardIcon className="text-muted-foreground" />
                <span className="flex-1">Raccourcis clavier</span>
                <Kbd>?</Kbd>
              </DropdownMenuItem>
            )}
          </>
        )}
        {tour && (
          <DropdownMenuItem onSelect={() => startTour(tour.id)}>
            <CompassIcon className="text-muted-foreground" />
            Visite guidée de la page
          </DropdownMenuItem>
        )}
        <DropdownMenuItem asChild>
          <Link href="/guide">
            <BookOpenIcon className="text-muted-foreground" />
            Guide d&apos;utilisation
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" disabled={isPending} onSelect={() => logout()}>
          <LogOutIcon />
          Se déconnecter
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
