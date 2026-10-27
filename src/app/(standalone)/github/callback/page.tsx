import { Suspense } from "react";

import { PageLoader } from "@/components/page-loader";

import { GithubCallbackClient } from "./client";

import { privatePage } from "@/lib/metadata";

export const metadata = privatePage("Connexion à GitHub");

const GithubCallbackPage = () => {
  return (
    <Suspense fallback={<PageLoader label="Connexion à GitHub…" />}>
      <GithubCallbackClient />
    </Suspense>
  );
};

export default GithubCallbackPage;
