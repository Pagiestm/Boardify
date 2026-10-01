import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/metadata";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    { url: SITE_URL, lastModified, changeFrequency: "monthly", priority: 1 },
    { url: `${SITE_URL}/sign-up`, lastModified, changeFrequency: "yearly", priority: 0.8 },
    { url: `${SITE_URL}/sign-in`, lastModified, changeFrequency: "yearly", priority: 0.5 },
  ];
}
