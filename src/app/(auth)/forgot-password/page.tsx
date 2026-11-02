import { ForgotPasswordCard } from "@/features/auth/components/forgot-password-card";

import { privatePage } from "@/lib/metadata";

export const metadata = privatePage(
  "Mot de passe oublié",
  "Recevez un lien pour choisir un nouveau mot de passe.",
);

const ForgotPasswordPage = () => <ForgotPasswordCard />;

export default ForgotPasswordPage;
