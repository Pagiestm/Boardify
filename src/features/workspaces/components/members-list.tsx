"use client";

import { useRouter } from "next/navigation";
import {
  LogOutIcon,
  MoreHorizontalIcon,
  ShieldCheckIcon,
  UserIcon,
  UserMinusIcon,
} from "lucide-react";

import { useCurrent } from "@/features/auth/api/use-current";
import { MemberRole } from "@/features/members/types";
import { useGetMembers } from "@/features/members/api/use-get-members";
import { MemberAvatar } from "@/features/members/components/member-avatar";
import { useDeleteMember } from "@/features/members/api/use-delete-member";
import { useUpdateMember } from "@/features/members/api/use-update-member";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useConfirm } from "@/hooks/use-confirm";
import { FormHeader } from "@/components/forms/form-shell";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const MembersList = () => {
  const router = useRouter();
  const workspaceId = useWorkspaceId();

  const [ConfirmDialog, confirm] = useConfirm(
    "Retirer le membre",
    "Ce membre perdra l'accès à l'espace de travail et à ses projets.",
    "destructive",
  );
  const [LeaveDialog, confirmLeave] = useConfirm(
    "Quitter l'espace",
    "Vous n'aurez plus accès à ses projets et à ses tâches, sauf si l'on vous invite à nouveau.",
    "destructive",
  );
  const { data: user } = useCurrent();

  const { data, isLoading } = useGetMembers({ workspaceId });
  const { mutate: deleteMember, isPending: isDeletingMember } = useDeleteMember();
  const { mutate: updateMember, isPending: isUpdatingMember } = useUpdateMember();

  const handleUpdateMember = (memberId: string, role: MemberRole) => {
    updateMember({
      json: { role },
      param: { memberId },
    });
  };

  const handleDeleteMember = async (memberId: string, isSelf: boolean) => {
    const ok = await (isSelf ? confirmLeave() : confirm());
    if (!ok) return;

    deleteMember(
      { param: { memberId } },
      {
        // Après avoir quitté l'espace, on rejoint un autre espace.
        onSuccess: () => (isSelf ? router.replace("/dashboard") : undefined),
      },
    );
  };

  const total = data?.documents.length ?? 0;
  const members = data?.documents ?? [];
  const currentMember = members.find((member) => member.userId === user?.$id);
  const canManage = currentMember?.role === MemberRole.ADMIN;
  const adminCount = members.filter((member) => member.role === MemberRole.ADMIN).length;

  return (
    <Card className="overflow-hidden">
      <ConfirmDialog />
      <LeaveDialog />
      <FormHeader
        onBack={() => router.push(`/workspaces/${workspaceId}`)}
        title="Membres"
        description={
          isLoading
            ? "Chargement des membres…"
            : `${total} membre${total > 1 ? "s" : ""} dans cet espace de travail`
        }
      />
      <ul className="divide-y border-t">
        {isLoading &&
          Array.from({ length: 3 }).map((_, i) => (
            <li key={i} className="flex items-center gap-3 px-6 py-3">
              <Skeleton className="size-8 rounded-full" />
              <Skeleton className="h-3.5 w-28" />
              <Skeleton className="h-3 w-40" />
            </li>
          ))}
        {!isLoading && total === 0 && (
          <li className="px-6 py-10 text-center text-sm text-muted-foreground">
            Aucun membre pour le moment.
          </li>
        )}
        {members.map((member) => {
          const isAdmin = member.role === MemberRole.ADMIN;
          const isSelf = member.$id === currentMember?.$id;
          // Il doit toujours rester un administrateur dans l'espace.
          const isLastAdmin = isAdmin && adminCount === 1;
          const isAlone = total === 1;
          const showMenu = isSelf ? !isAlone : canManage;

          return (
            <li key={member.$id} className="flex items-center gap-3 px-6 py-3">
              <MemberAvatar
                className="size-8"
                fallbackClassName="text-xs"
                name={member.name}
                image={member.avatarUrl}
              />
              <div className="flex min-w-0 flex-1 flex-col">
                <p className="flex items-center gap-2 text-sm font-medium">
                  <span className="truncate">{member.name}</span>
                  {isSelf && <span className="shrink-0 text-xs text-muted-foreground">(vous)</span>}
                </p>
                <p className="truncate text-xs text-muted-foreground">{member.email}</p>
              </div>
              <Badge variant={isAdmin ? "soft" : "secondary"}>{isAdmin ? "Admin" : "Membre"}</Badge>
              {showMenu ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={isSelf ? "Vos actions" : `Actions pour ${member.name}`}
                    >
                      <MoreHorizontalIcon />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side="bottom" align="end" className="w-60">
                    {canManage && !isSelf && (
                      <>
                        <DropdownMenuLabel>Rôle</DropdownMenuLabel>
                        {isAdmin ? (
                          <DropdownMenuItem
                            onClick={() => handleUpdateMember(member.$id, MemberRole.MEMBER)}
                            disabled={isUpdatingMember || isLastAdmin}
                          >
                            <UserIcon />
                            Définir comme membre
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onClick={() => handleUpdateMember(member.$id, MemberRole.ADMIN)}
                            disabled={isUpdatingMember}
                          >
                            <ShieldCheckIcon />
                            Définir comme administrateur
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => handleDeleteMember(member.$id, false)}
                          disabled={isDeletingMember || isLastAdmin}
                        >
                          <UserMinusIcon />
                          Retirer {member.name}
                        </DropdownMenuItem>
                      </>
                    )}
                    {isSelf && (
                      <>
                        {isAdmin && !isLastAdmin && (
                          <DropdownMenuItem
                            onClick={() => handleUpdateMember(member.$id, MemberRole.MEMBER)}
                            disabled={isUpdatingMember}
                          >
                            <UserIcon />
                            Ne plus être administrateur
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => handleDeleteMember(member.$id, true)}
                          disabled={isDeletingMember || isLastAdmin}
                        >
                          <LogOutIcon />
                          Quitter l&apos;espace
                        </DropdownMenuItem>
                        {isLastAdmin && (
                          <p className="px-2 py-1.5 text-xs text-muted-foreground">
                            Vous êtes le seul administrateur : nommez-en un autre pour pouvoir
                            quitter l&apos;espace.
                          </p>
                        )}
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <span aria-hidden className="size-8 shrink-0" />
              )}
            </li>
          );
        })}
      </ul>
    </Card>
  );
};
