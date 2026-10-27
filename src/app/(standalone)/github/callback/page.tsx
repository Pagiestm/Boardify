import { Suspense } from "react";

import { PageLoader } from "@/components/page-loader";

import { GithubCallbackClient } from "./client";

import { privatePage } from "@/lib/metadata";

export const metadata = privatePage("Connexion à GitHub");

// Pas de vérification de session ici : GitHub redirige depuis un autre site et le cookie
// de session (SameSite=Strict) n'est pas envoyé. L'appel API fait par la page, lui, le porte.
const GithubCallbackPage = () => {
  return (
    <Suspense fallback={<PageLoader label="Connexion à GitHub…" />}>
      <GithubCallbackClient />
    </Suspense>
  );
};

export default GithubCallbackPage;
