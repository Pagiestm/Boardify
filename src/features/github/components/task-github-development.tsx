"use client";

import { toast } from "sonner";
import { FaGithub } from "react-icons/fa";
import { CopyIcon, GitBranchIcon, GitPullRequestIcon, PlusIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { useCreateGithubBranch } from "../api/use-create-github-branch";
import { useGetGithubDevelopment } from "../api/use-get-github-development";

type PullRequest = NonNullable<
  ReturnType<typeof useGetGithubDevelopment>["data"]
>["pullRequests"][number];

const pullRequestStatus = (pullRequest: PullRequest) => {
  if (pullRequest.state === "MERGED") return { label: "Mergée", variant: "soft" as const };
  if (pullRequest.state === "CLOSED") return { label: "Fermée", variant: "secondary" as const };
  if (pullRequest.isDraft) return { label: "Brouillon", variant: "outline" as const };
  if (pullRequest.reviewDecision === "APPROVED") {
    return { label: "Approuvée", variant: "soft" as const };
  }
  if (pullRequest.reviewDecision === "CHANGES_REQUESTED") {
    return { label: "Changements demandés", variant: "destructive" as const };
  }
  return { label: "En review", variant: "outline" as const };
};

interface TaskGithubDevelopmentProps {
  taskId: string;
}

export const TaskGithubDevelopment = ({ taskId }: TaskGithubDevelopmentProps) => {
  const { data, isLoading, isError } = useGetGithubDevelopment({ taskId });
  const { mutate: createBranch, isPending: isCreating } = useCreateGithubBranch();

  const copyCheckout = async (branch: string) => {
    try {
      await navigator.clipboard.writeText(`git fetch origin && git checkout ${branch}`);
      toast.success("Commande copiée");
    } catch {
      toast.error("Impossible de copier la commande");
    }
  };

  const isEmpty = data && data.branches.length === 0 && data.pullRequests.length === 0;

  return (
    <Card>
      <CardHeader className="flex-row flex-wrap items-center justify-between gap-2 border-b py-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <FaGithub className="size-4" />
          Développement
        </CardTitle>
        {data && data.branches.length === 0 && (
          <Button
            size="sm"
            variant="outline"
            disabled={isCreating}
            onClick={() => createBranch({ param: { taskId } })}
          >
            {isCreating ? <Spinner /> : <PlusIcon />}
            Créer une branche
          </Button>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-3 py-3 text-sm">
        {isLoading ? (
          <Skeleton className="h-5 w-48" />
        ) : isError ? (
          <p className="text-muted-foreground">Impossible de lire GitHub pour le moment.</p>
        ) : isEmpty ? (
          <p className="text-muted-foreground">Aucune branche ni pull request liée.</p>
        ) : (
          <>
            {data?.branches.map((branch) => (
              <div key={branch.name} className="flex min-w-0 items-center gap-2">
                <GitBranchIcon className="size-4 shrink-0 text-muted-foreground" />
                <a
                  href={branch.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="truncate font-mono text-xs hover:underline"
                >
                  {branch.name}
                </a>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  className="ml-auto shrink-0"
                  onClick={() => copyCheckout(branch.name)}
                  aria-label="Copier la commande git checkout"
                  title="Copier git checkout"
                >
                  <CopyIcon />
                </Button>
              </div>
            ))}
            {data?.pullRequests.map((pullRequest) => {
              const status = pullRequestStatus(pullRequest);
              return (
                <div key={pullRequest.number} className="flex min-w-0 items-center gap-2">
                  <GitPullRequestIcon className="size-4 shrink-0 text-muted-foreground" />
                  <a
                    href={pullRequest.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="truncate hover:underline"
                  >
                    #{pullRequest.number} {pullRequest.title}
                  </a>
                  <Badge variant={status.variant} className="ml-auto">
                    {status.label}
                  </Badge>
                </div>
              );
            })}
          </>
        )}
      </CardContent>
    </Card>
  );
};
