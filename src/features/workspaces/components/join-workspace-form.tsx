"use client"

import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";

import { WorkspaceAvatar } from "./workspace-avatar";

import { useInviteCode } from "../hooks/use-invite-code";
import { useWorkspaceId } from "../hooks/use-workspace-id";
import { useJoinWorkspace } from "../api/use-join-workspace";

interface JoinWorkspaceFormProps {
    initialValues: {
        name: string;
        imageUrl?: string;
    }
}

export const JoinWorkspaceForm = ({
    initialValues,
}: JoinWorkspaceFormProps) => {
    const router = useRouter();
    const workspaceId = useWorkspaceId();
    const inviteCode = useInviteCode();
    const { mutate, isPending } = useJoinWorkspace();

    const onSubmit = () => {
        mutate({
            param: { workspaceId },
            json: { code: inviteCode }
        }, {
            onSuccess: ({ data }) => {
                router.push(`/workspaces/${data.$id}`)
            }
        });
    }

    return (
        <Card>
            <div className="flex flex-col items-center gap-4 px-6 pt-8 pb-6 text-center">
                <WorkspaceAvatar
                    name={initialValues.name}
                    image={initialValues.imageUrl}
                    className="size-14"
                    fallbackClassName="text-xl"
                />
                <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Vous êtes invité à rejoindre</p>
                    <h1 className="text-xl font-semibold tracking-tight">{initialValues.name}</h1>
                </div>
                <p className="max-w-sm text-sm text-muted-foreground">
                    En rejoignant cet espace de travail, vous aurez accès à ses projets et à ses tâches.
                </p>
            </div>
            <div className="flex flex-col-reverse gap-2 border-t px-6 py-4 sm:flex-row sm:justify-end">
                <Button
                    variant="ghost"
                    type="button"
                    asChild
                    disabled={isPending}
                >
                    <Link href="/dashboard">
                        Refuser
                    </Link>
                </Button>
                <Button
                    type="button"
                    onClick={onSubmit}
                    disabled={isPending}
                >
                    {isPending && <Spinner className="text-primary-foreground" />}
                    Rejoindre l&apos;espace
                </Button>
            </div>
        </Card>
    );
}
