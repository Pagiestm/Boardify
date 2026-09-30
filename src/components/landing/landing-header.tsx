"use client";

import { useState } from "react";
import Link from "next/link";
import { MenuIcon, XIcon } from "lucide-react";

import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

const links = [
  { href: "#fonctionnalites", label: "Fonctionnalités" },
  { href: "#vues", label: "Vues" },
  { href: "#faq", label: "FAQ" },
];

interface LandingHeaderProps {
  isLoggedIn: boolean;
}

const HeaderActions = ({ isLoggedIn }: LandingHeaderProps) => {
  if (isLoggedIn) {
    return (
      <Button asChild size="sm">
        <Link href="/dashboard">Ouvrir mon espace</Link>
      </Button>
    );
  }

  return (
    <>
      <Button asChild variant="ghost" size="sm">
        <Link href="/sign-in">Se connecter</Link>
      </Button>
      <Button asChild size="sm">
        <Link href="/sign-up">Commencer gratuitement</Link>
      </Button>
    </>
  );
};

export const LandingHeader = ({ isLoggedIn }: LandingHeaderProps) => {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b bg-background">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-8">
          <Logo />
          <nav className="hidden items-center gap-6 md:flex">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>
        <div className="hidden items-center gap-2 md:flex">
          <ThemeToggle />
          <HeaderActions isLoggedIn={isLoggedIn} />
        </div>
        <div className="flex items-center gap-1 md:hidden">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <XIcon /> : <MenuIcon />}
          </Button>
        </div>
      </div>
      {open && (
        <div className="border-t md:hidden">
          <nav className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-3">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-md px-2 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                {link.label}
              </a>
            ))}
            <div className="mt-2 flex flex-col gap-2 border-t pt-3 [&>a]:w-full">
              <HeaderActions isLoggedIn={isLoggedIn} />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};
