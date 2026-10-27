"use client";

import Link from "next/link";

import { Skeleton } from "@/components/ui/skeleton";
import {
  FormControl,
  FormDescription,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useGetGithubConnection } from "../api/use-get-github-connection";

const NO_REPOSITORY = "__none__";

interface GithubRepoFieldProps {
  workspaceId: string;
  value?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export const GithubRepoField = ({
  workspaceId,
  value,
  onChange,
  disabled,
}: GithubRepoFieldProps) => {
  const { data, isLoading } = useGetGithubConnection({ workspaceId });

  if (!isLoading && !data?.configured) return null;

  const repositories = data?.connection?.repositories ?? [];
  const options = value && !repositories.includes(value) ? [value, ...repositories] : repositories;

  return (
    <FormItem>
      <FormLabel>Dépôt GitHub</FormLabel>
      {isLoading ? (
        <Skeleton className="h-9 w-full" />
      ) : data?.connection ? (
        <Select
          value={value || NO_REPOSITORY}
          onValueChange={(next) => onChange(next === NO_REPOSITORY ? "" : next)}
          disabled={disabled}
        >
          <FormControl>
            <SelectTrigger>
              <SelectValue placeholder="Choisir un dépôt" />
            </SelectTrigger>
          </FormControl>
          <SelectContent>
            <SelectItem value={NO_REPOSITORY}>Aucun dépôt</SelectItem>
            {options.map((repository) => (
              <SelectItem key={repository} value={repository}>
                {repository}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}
      <FormDescription>
        {data?.connection ? (
          "Chaque nouvelle tâche crée une issue dans ce dépôt, fermée quand la tâche est terminée."
        ) : (
          <>
            Connectez GitHub dans les{" "}
            <Link href={`/workspaces/${workspaceId}/settings`} className="underline">
              paramètres de l&apos;espace de travail
            </Link>{" "}
            pour lier un dépôt à ce projet.
          </>
        )}
      </FormDescription>
      <FormMessage />
    </FormItem>
  );
};
