"use client";

import { FaGithub } from "react-icons/fa";
import { ExternalLinkIcon } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useConfirm } from "@/hooks/use-confirm";

import { useGetGithubConnection } from "../api/use-get-github-connection";
import { useUnlinkGithubAccount } from "../api/use-unlink-github-account";
import { useUnlinkGithubInstallation } from "../api/use-unlink-github-installation";

interface GithubConnectionCardProps {
  workspaceId: string;
}

export const GithubConnectionCard = ({ workspaceId }: GithubConnectionCardProps) => {
  const { data, isLoading } = useGetGithubConnection({ workspaceId });
  const { mutate: unlink, isPending: isUnlinking } = useUnlinkGithubInstallation();
  const { mutate: unlinkAccount, isPending: isUnlinkingAccount } = useUnlinkGithubAccount();

  const [UnlinkDialog, confirmUnlink] = useConfirm(
    "Déconnecter GitHub",
    "Les nouvelles tâches ne créeront plus d'issues. Les issues existantes restent sur GitHub.",
    "destructive",
  );

  if (!isLoading && !data?.configured) return null;

  const handleUnlink = async () => {
    const ok = await confirmUnlink();
    if (!ok) return;

    unlink({ param: { workspaceId } });
  };

  const connection = data?.connection;
  const installUrl = `/api/github/install?workspaceId=${workspaceId}`;
  const linkAccountUrl = `/api/github/account/link?workspaceId=${workspaceId}`;

  return (
    <Card>
      <UnlinkDialog />
      <div className="space-y-4 p-6">
        <div className="space-y-1">
          <h3 className="flex items-center gap-2 text-base font-semibold">
            <FaGithub className="size-4" />
            GitHub
            {connection && <Badge variant="soft">Connecté</Badge>}
          </h3>
          <p className="text-sm text-muted-foreground">
            Liez un dépôt à chaque projet : ses nouvelles tâches créent une issue, fermée quand la
            tâche est terminée.
          </p>
        </div>

        {isLoading ? (
          <Skeleton className="h-8 w-48" />
        ) : connection ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm">
              Installé sur <strong className="font-medium">{connection.account}</strong> ·{" "}
              {connection.repositories.length} dépôt
              {connection.repositories.length > 1 ? "s" : ""} accessible
              {connection.repositories.length > 1 ? "s" : ""}
            </p>
            {data?.canManage && (
              <div className="flex gap-2">
                <Button size="sm" variant="outline" asChild>
                  <a href={connection.htmlUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLinkIcon />
                    Gérer les dépôts
                  </a>
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleUnlink}
                  disabled={isUnlinking}
                  className="text-destructive hover:text-destructive"
                >
                  Déconnecter
                </Button>
              </div>
            )}
          </div>
        ) : null}

        {connection && (
          <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-0.5">
              <p className="text-sm font-medium">Votre compte GitHub</p>
              <p className="text-sm text-muted-foreground">
                {connection.viewer ? (
                  <>
                    Les tâches qui vous sont assignées le seront à{" "}
                    <strong className="font-medium text-foreground">
                      @{connection.viewer.login}
                    </strong>{" "}
                    sur GitHub.
                  </>
                ) : (
                  "Liez votre compte pour être assigné aux issues des tâches qui vous sont confiées."
                )}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button size="sm" variant="outline" asChild>
                <a href={linkAccountUrl}>
                  <FaGithub />
                  {connection.viewer ? "Changer de compte" : "Lier mon compte GitHub"}
                </a>
              </Button>
              {connection.viewer?.linked && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => unlinkAccount()}
                  disabled={isUnlinkingAccount}
                >
                  Délier
                </Button>
              )}
            </div>
          </div>
        )}

        {isLoading || connection ? null : (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              {data?.broken
                ? "L'application GitHub a été désinstallée ou n'est plus accessible."
                : "Aucun compte GitHub connecté."}
            </p>
            {data?.canManage ? (
              <Button size="sm" asChild>
                <a href={installUrl}>
                  <FaGithub />
                  {data?.broken ? "Reconnecter GitHub" : "Connecter GitHub"}
                </a>
              </Button>
            ) : (
              <p className="text-sm text-muted-foreground">
                Un administrateur peut connecter GitHub.
              </p>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};
