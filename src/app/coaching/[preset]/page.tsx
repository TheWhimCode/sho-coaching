import Client from "./Client";

export default async function Page({
  params,
}: {
  params: { preset: string };
}) {
  const { preset } = params;
  return <Client preset={preset} />;
}


export async function generateMetadata({
  params,
}: {
  params: { preset: string };
}) {
  const { preset } = params;
  const canonicalPreset = preset.replace(/-/g, "_");

  const titles: Record<string, string> = {
    vod: "VOD Review",
    signature: "Signature Session",
    instant: "Instant Insight",
    custom: "Custom Session",
    bundle_4x60: "Elo Rush",
  };

  return {
    title: `${titles[canonicalPreset] ?? canonicalPreset} | Sho`,
    description: "Book a session tailored to your goals.",
  };
}

