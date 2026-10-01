import type { Metadata } from "next";

export const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const privatePage = (title: string, description?: string): Metadata => ({
  title,
  description,
  robots: { index: false, follow: false },
});

export const publicPage = (title: string, description: string, path: string): Metadata => ({
  title,
  description,
  alternates: { canonical: path },
  openGraph: {
    title: `${title} · Boardify`,
    description,
    url: path,
    siteName: "Boardify",
    locale: "fr_FR",
    type: "website",
  },
});
