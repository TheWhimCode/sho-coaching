import Client from "./Client";

export default async function Page({
  params,
}: {
  params: Promise<{ preset: string }>;
}) {
  const { preset } = await params;
  return <Client preset={preset} />;
}

// (optional) SEO per preset
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
  };
  return {
    title: `${titles[preset] ?? preset} | Sho`,
    description: "Book a session tailored to your goals.",
  };
}
