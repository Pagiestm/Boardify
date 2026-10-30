"use client";

import { PageError } from "@/components/page-error";
import { PageLoader } from "@/components/page-loader";

import { useAccount } from "../api/use-account";
import { ProfileCard } from "./profile-card";
import { IdentitiesCard, PasswordCard } from "./security-card";
import { DeleteAccountCard, PreferencesCard, WorkspacesCard } from "./workspaces-card";

/** « Mon compte » : profil, sécurité, espaces et préférences. */
export const AccountPage = () => {
  const { data: profile, isLoading } = useAccount();

  if (isLoading) return <PageLoader />;
  if (!profile) return <PageError message="Impossible de charger votre compte" />;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <ProfileCard key={`${profile.name}:${profile.email}`} profile={profile} />
      <PasswordCard profile={profile} />
      <IdentitiesCard />
      <WorkspacesCard />
      <PreferencesCard profile={profile} />
      <DeleteAccountCard profile={profile} />
    </div>
  );
};
