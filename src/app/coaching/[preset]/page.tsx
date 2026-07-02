import Client from "./Client";
import { SITE_URL } from "@/lib/site";
import { coachingSessionBanner } from "@/lib/coaching/coachingClipVideos";

export default async function Page({
  params,
}: {
  params: Promise<{ preset: string }>;
}) {
  const { preset } = await params;
  return <Client preset={preset} />;
}

// SEO + OpenGraph metadata per preset
export async function generateMetadata({
  params,
}: {
  params: Promise<{ preset: string }>;
}) {
  const { preset } = await params;

  const titles: Record<string, string> = {
    vod: "VOD Review",
    signature: "Signature Session",
    instant: "Instant Insight",
    custom: "Custom Session",
    rush: "Elo Rush",
  };

  const descriptions: Record<string, string> = {
    vod: "League of Legends VOD review coaching — in-depth analysis of your gameplay with answers to your specific questions.",
    instant: "Quick LoL coaching for focused questions. Same-day scheduling when slots are open.",
    signature: "Mino’s signature League coaching session — structured, informative, without overload.",
    custom: "Custom League of Legends coaching tailored to your rank, role, and goals.",
    rush: "Four-session LoL coaching bundle at a discount, with a climb plan across the series.",
  };

  const ogImages: Record<string, string> = {
    signature: coachingSessionBanner("SignatureBanner.png"),
    vod: coachingSessionBanner("VODBanner.png"),
    instant: coachingSessionBanner("InstantBanner.png"),
    rush: coachingSessionBanner("RushBanner.png"),
  };

  const title = titles[preset] ?? preset;
  const description =
    descriptions[preset] ?? "Book League of Legends coaching tailored to your goals.";

  const ogImage = ogImages[preset] ?? `${SITE_URL}/default-og.png`;

  return {
    title,
    description,
    alternates: {
      canonical: `/coaching/${preset}`,
    },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/coaching/${preset}`,
      siteName: "Mino",
      type: "website",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}
