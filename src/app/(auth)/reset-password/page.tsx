import { ResetPasswordCard } from "@/features/auth/components/reset-password-card";

import { privatePage } from "@/lib/metadata";

export const metadata = privatePage("Nouveau mot de passe", "Choisissez un nouveau mot de passe.");

interface ResetPasswordPageProps {
  searchParams: Promise<{ userId?: string; secret?: string }>;
}

const ResetPasswordPage = async ({ searchParams }: ResetPasswordPageProps) => {
  const { userId, secret } = await searchParams;
  return <ResetPasswordCard userId={userId} secret={secret} />;
};

export default ResetPasswordPage;
