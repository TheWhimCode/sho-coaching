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
    rush: "Elo Rush",
  };

  const descriptions: Record<string, string> = {
    vod: "Get an in-depth analysis of your gameplay. All your questions will be answered.",
    instant: "Fast, detailed answers on a budget. Fantastic value, especially for beginners.",
    signature: "My take on the perfect coaching session. No information overload, yet highly informative.",
    custom: "A session tailored exactly to your needs.",
    rush: "Four-session bundle at a massive discount. Improvement plan included.",
  };

  const ogImages: Record<string, string> = {
    signature: "/images/sessions/banner/SignatureBanner.png",
    vod: "/images/sessions/banner/VODBanner.png",
    instant: "/images/sessions/banner/InstantBanner.png",
    rush: "/images/sessions/banner/RushBanner.png",
  };

  const title = `${titles[preset] ?? preset} | Sho`;
  const description = descriptions[preset] ?? "Book a session tailored to your goals.";

  const ogImage = ogImages[preset]
    ? `https://sho-coaching.com${ogImages[preset]}`
    : "https://sho-coaching.com/default-og.png";

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
