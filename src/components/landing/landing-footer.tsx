import Link from "next/link";

import { Logo } from "@/components/brand/logo";
import { AppVersion } from "@/components/app-version";

const links = [
    { href: "#fonctionnalites", label: "Fonctionnalités" },
    { href: "#vues", label: "Vues" },
    { href: "#faq", label: "FAQ" },
    { href: "/sign-in", label: "Se connecter" },
    { href: "/sign-up", label: "Créer un compte" },
];

export const LandingFooter = () => {
    return (
        <footer>
            <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div className="flex flex-col gap-2">
                    <Logo />
                    <p className="flex items-center gap-2 text-sm text-muted-foreground">
                        © 2026 Boardify. Tous droits réservés.
                        <span aria-hidden>·</span>
                        <AppVersion className="text-sm" />
                    </p>
                </div>
                <nav className="flex flex-wrap gap-x-6 gap-y-2">
                    {links.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                        >
                            {link.label}
                        </Link>
                    ))}
                </nav>
            </div>
        </footer>
    );
};
