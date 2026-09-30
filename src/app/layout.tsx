import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { NuqsAdapter } from "nuqs/adapters/next/app";

import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import { QueryProvider } from "@/components/query-provider";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "Boardify — Gestion de projets simple pour les équipes",
    template: "%s · Boardify",
  },
  description:
    "Boardify réunit vos espaces de travail, projets et tâches : kanban, calendrier, tableau et statistiques pour avancer ensemble.",
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
