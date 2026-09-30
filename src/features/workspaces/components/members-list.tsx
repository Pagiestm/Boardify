"use client";

import { useRouter } from "next/navigation";
import { MoreHorizontalIcon, ShieldCheckIcon, UserIcon, UserMinusIcon } from "lucide-react";

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

  const { data, isLoading } = useGetMembers({ workspaceId });
  const { mutate: deleteMember, isPending: isDeletingMember } = useDeleteMember();
  const { mutate: updateMember, isPending: isUpdatingMember } = useUpdateMember();

  const handleUpdateMember = (memberId: string, role: MemberRole) => {
    updateMember({
      json: { role },
      param: { memberId },
    });
  };

  const handleDeleteMember = async (memberId: string) => {
    const ok = await confirm();
    if (!ok) return;

    deleteMember(
      { param: { memberId } },
      {
        onSuccess: () => {
          window.location.reload();
        },
      },
    );
  };

  const total = data?.documents.length ?? 0;

  return (
    <Card className="overflow-hidden">
      <ConfirmDialog />
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
        {data?.documents.map((member) => {
          const isAdmin = member.role === MemberRole.ADMIN;

          return (
            <li key={member.$id} className="flex items-center gap-3 px-6 py-3">
              <MemberAvatar className="size-8" fallbackClassName="text-xs" name={member.name} />
              <div className="flex min-w-0 flex-1 flex-col">
                <p className="truncate text-sm font-medium">{member.name}</p>
                <p className="truncate text-xs text-muted-foreground">{member.email}</p>
              </div>
              <Badge variant={isAdmin ? "soft" : "secondary"}>{isAdmin ? "Admin" : "Membre"}</Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon-sm" aria-label={`Actions pour ${member.name}`}>
                    <MoreHorizontalIcon />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="bottom" align="end" className="w-56">
                  <DropdownMenuLabel>Rôle</DropdownMenuLabel>
                  {!isAdmin && (
                    <DropdownMenuItem
                      onClick={() => handleUpdateMember(member.$id, MemberRole.ADMIN)}
                      disabled={isUpdatingMember}
                    >
                      <ShieldCheckIcon />
                      Définir comme administrateur
                    </DropdownMenuItem>
                  )}
                  {member.role !== MemberRole.MEMBER && (
                    <DropdownMenuItem
                      onClick={() => handleUpdateMember(member.$id, MemberRole.MEMBER)}
                      disabled={isUpdatingMember}
                    >
                      <UserIcon />
                      Définir comme membre
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => handleDeleteMember(member.$id)}
                    disabled={isDeletingMember}
                  >
                    <UserMinusIcon />
                    Retirer {member.name}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </li>
          );
        })}
      </ul>
    </Card>
  );
};
