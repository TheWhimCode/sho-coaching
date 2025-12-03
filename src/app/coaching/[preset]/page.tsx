import Client from "./Client";

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
    bundle_4x60: "Elo Rush",
  };

  // Map presets → OG banner images
  const ogImages: Record<string, string> = {
    signature: "/images/sessions/banner/SignatureBanner.png",
    vod: "/images/sessions/banner/VODBanner.png",
    instant: "/images/sessions/banner/InstantBanner.png",
    bundle_4x60: "/images/sessions/banner/RushBanner.png",

    // Add more here later:
    // vod: "/images/sessions/banner/VODBanner.png",
    // instant: "/images/sessions/banner/InstantBanner.png",
  };

  const title = `${titles[preset] ?? preset} | Sho`;
  const description = "Book a session tailored to your goals.";

  // If preset has a specific banner, use it. Otherwise use a fallback.
  const ogImage = ogImages[preset]
    ? `https://sho-coaching.com${ogImages[preset]}`
    : "https://sho-coaching.com/default-og.png"; // optional fallback, replace or remove

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://sho-coaching.com/coaching/${preset}`,
      siteName: "Sho Coaching",
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
