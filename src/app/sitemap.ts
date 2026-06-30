import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

const BASE = SITE_URL;

const COACHING_PRESETS = ["vod", "signature", "instant", "custom", "rush"] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    { url: BASE, lastModified, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/coaching`, lastModified, changeFrequency: "weekly", priority: 0.95 },
    ...COACHING_PRESETS.map((preset) => ({
      url: `${BASE}/coaching/${preset}`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.85,
    })),
    { url: `${BASE}/skillcheck`, lastModified, changeFrequency: "daily", priority: 0.7 },
    { url: `${BASE}/guide`, lastModified, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/about`, lastModified, changeFrequency: "monthly", priority: 0.75 },
    { url: `${BASE}/coaching/prepare`, lastModified, changeFrequency: "yearly", priority: 0.4 },
  ];
}
