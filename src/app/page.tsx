import type { Metadata } from "next";

import { getCurrent } from "@/features/auth/queries";

import { Faq } from "@/components/landing/faq";
import { Hero } from "@/components/landing/hero";
import { Features } from "@/components/landing/features";
import { FinalCta } from "@/components/landing/final-cta";
import { HowItWorks } from "@/components/landing/how-it-works";
import { ViewsSection } from "@/components/landing/views-section";
import { LandingHeader } from "@/components/landing/landing-header";
import { LandingFooter } from "@/components/landing/landing-footer";

export const metadata: Metadata = {
    title: {
        absolute: "Boardify — Gestion de projets simple pour les équipes",
    },
};

export default async function LandingPage() {
    let isLoggedIn = false;

    try {
        isLoggedIn = Boolean(await getCurrent());
    } catch {
        isLoggedIn = false;
    }

    return (
        <div className="min-h-screen overflow-x-clip">
            <LandingHeader isLoggedIn={isLoggedIn} />
            <main>
                <Hero isLoggedIn={isLoggedIn} />
                <Features />
                <ViewsSection />
                <HowItWorks />
                <Faq />
                <FinalCta isLoggedIn={isLoggedIn} />
            </main>
            <LandingFooter />
        </div>
    );
}
