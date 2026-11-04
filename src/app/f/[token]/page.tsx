import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getPublicIntakeForm } from "@/features/intake/server/public";
import { PublicIntakeForm } from "@/features/intake/components/public-intake-form";

import { Logo } from "@/components/brand/logo";

interface IntakePageProps {
  params: Promise<{ token: string }>;
}

/** Jamais indexée, et l'adresse (qui contient le jeton) n'est pas transmise aux autres sites. */
export const metadata: Metadata = {
  title: "Formulaire de demande",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

/** Page publique, sans connexion : seuls le titre et l'introduction du formulaire sont affichés. */
const IntakePage = async ({ params }: IntakePageProps) => {
  const { token } = await params;
  const found = await getPublicIntakeForm(token);
  if (!found) notFound();

  return (
    <main className="flex min-h-screen flex-col items-center bg-muted/40 px-4 py-10 sm:py-16">
      <div className="flex w-full max-w-lg flex-col gap-8">
        <Logo className="self-center" />
        <PublicIntakeForm token={token} title={found.form.title} intro={found.form.intro ?? ""} />
        <p className="text-center text-xs text-muted-foreground">
          Propulsé par Boardify · Vos informations servent uniquement à traiter cette demande.
        </p>
      </div>
    </main>
  );
};

export default IntakePage;
