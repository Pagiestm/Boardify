"use client";

import { useState } from "react";
import Link from "next/link";
import { MenuIcon } from "lucide-react";

import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const links = [
  { href: "/#fonctionnalites", label: "Fonctionnalités" },
  { href: "/#vues", label: "Vues" },
  { href: "/#github", label: "GitHub" },
  { href: "/#ia", label: "IA" },
  { href: "/#faq", label: "FAQ" },
  { href: "/download", label: "Application" },
  { href: "/guide", label: "Guide" },
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
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Ouvrir le menu">
                <MenuIcon />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 gap-0 p-0" aria-describedby={undefined}>
              <SheetTitle className="sr-only">Menu</SheetTitle>
              <div className="flex h-14 shrink-0 items-center border-b px-4">
                <Logo />
              </div>
              <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-3">
                {links.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="rounded-md px-2.5 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  >
                    {link.label}
                  </a>
                ))}
              </nav>
              <div className="flex flex-col gap-2 border-t p-3 [&>a]:w-full">
                <HeaderActions isLoggedIn={isLoggedIn} />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};
