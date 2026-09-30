import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { NuqsAdapter } from "nuqs/adapters/next/app";

import { cn } from "@/lib/utils";
import { SITE_URL } from "@/lib/metadata";
import { Toaster } from "@/components/ui/sonner";
import { QueryProvider } from "@/components/query-provider";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const DESCRIPTION =
  "Boardify réunit vos espaces de travail, projets et tâches : kanban, calendrier, tableau et statistiques pour avancer ensemble.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Boardify - Gestion de projets simple pour les équipes",
    template: "%s · Boardify",
  },
  description: DESCRIPTION,
  applicationName: "Boardify",
  keywords: [
    "gestion de projet",
    "kanban",
    "tâches",
    "espace de travail",
    "collaboration",
    "équipe",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: "/",
    siteName: "Boardify",
    title: "Boardify - Gestion de projets simple pour les équipes",
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: "Boardify - Gestion de projets simple pour les équipes",
    description: DESCRIPTION,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#18181b" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={cn(inter.variable, "min-h-screen font-sans antialiased")}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <NuqsAdapter>
            <QueryProvider>
              <Toaster />
              {children}
            </QueryProvider>
          </NuqsAdapter>
        </ThemeProvider>
      </body>
    </html>
  );
}
