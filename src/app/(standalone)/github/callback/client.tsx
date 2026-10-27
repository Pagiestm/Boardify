"use client";

import Link from "next/link";
import { toast } from "sonner";
import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { ACCOUNT_STATE_PREFIX } from "@/features/github/constants";
import { useLinkGithubAccount } from "@/features/github/api/use-link-github-account";
import { useLinkGithubInstallation } from "@/features/github/api/use-link-github-installation";

import { Button } from "@/components/ui/button";
import { PageError } from "@/components/page-error";
import { PageLoader } from "@/components/page-loader";

// Une page atteinte par redirection depuis github.com reste « cross-site » : le navigateur
// n'envoie pas le cookie de session (SameSite=Strict), même sur ses appels API. Recharger la
// page depuis Boardify en fait une navigation same-site, qui porte le cookie.
const SAME_SITE_PARAM = "same_site";

export const GithubCallbackClient = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { mutate: linkInstallation, error: installationError } = useLinkGithubInstallation();
  const { mutate: linkAccount, error: accountError } = useLinkGithubAccount();
  const error = installationError ?? accountError;
  const started = useRef(false);

  const installationId = searchParams.get("installation_id") ?? undefined;
  const state = searchParams.get("state") ?? undefined;
  const code = searchParams.get("code");
  const isRequest = searchParams.get("setup_action") === "request";
  const isAccountLink = state?.startsWith(ACCOUNT_STATE_PREFIX) ?? false;
  const needsSameSiteReload = searchParams.get(SAME_SITE_PARAM) !== "1";

  useEffect(() => {
    if (needsSameSiteReload) {
      const url = new URL(window.location.href);
      url.searchParams.set(SAME_SITE_PARAM, "1");
      window.location.replace(url);
      return;
    }

    if (started.current || isRequest || !code) return;
    started.current = true;

    if (isAccountLink && state) {
      linkAccount(
        { json: { state, code } },
        {
          onSuccess: ({ data }) => {
            toast.success(`Compte GitHub @${data.login} lié`);
            router.replace(data.workspaceId ? `/workspaces/${data.workspaceId}/settings` : "/");
          },
        },
      );
      return;
    }

    linkInstallation(
      { json: { installationId, state, code } },
      {
        onSuccess: ({ data }) => {
          toast.success("GitHub connecté");
          router.replace(`/workspaces/${data.workspaceId}/settings`);
        },
      },
    );
  }, [
    code,
    installationId,
    isAccountLink,
    isRequest,
    linkAccount,
    linkInstallation,
    needsSameSiteReload,
    router,
    state,
  ]);

  const backButton = (
    <Button variant="outline" asChild>
      <Link href="/dashboard">Retour à Boardify</Link>
    </Button>
  );

  if (needsSameSiteReload) {
    return <PageLoader label="Connexion à GitHub…" />;
  }

  if (isRequest) {
    return (
      <PageError
        message="Demande envoyée"
        description="Un propriétaire de l'organisation GitHub doit approuver l'installation. Reconnectez ensuite GitHub depuis les paramètres de l'espace."
      >
        {backButton}
      </PageError>
    );
  }

  if (!code || error) {
    return (
      <PageError
        message="Connexion à GitHub impossible"
        description={error?.message ?? "Le lien de retour de GitHub est incomplet. Recommencez."}
      >
        {backButton}
      </PageError>
    );
  }

  return <PageLoader label="Connexion à GitHub…" />;
};
