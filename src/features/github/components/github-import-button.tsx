"use client";

import { DownloadIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

import { useImportGithubIssues } from "../api/use-import-github-issues";

interface GithubImportButtonProps {
  projectId: string;
  repo: string;
}

export const GithubImportButton = ({ projectId, repo }: GithubImportButtonProps) => {
  const { mutate, isPending } = useImportGithubIssues();

  return (
    <div className="flex flex-col gap-3 rounded-md border border-dashed p-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">
        Créez une tâche pour chaque issue ouverte de{" "}
        <strong className="font-medium text-foreground">{repo}</strong> qui n&apos;en a pas encore.
      </p>
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={isPending}
        onClick={() => mutate({ param: { projectId } })}
        className="shrink-0"
      >
        {isPending ? <Spinner /> : <DownloadIcon />}
        Importer les issues
      </Button>
    </div>
  );
};
