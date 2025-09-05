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
    vod: "VOD Review Coaching",
    signature: "Signature Coaching Session",
    instant: "Instant Coaching",
  };
  return {
    title: titles[preset] ?? "Coaching",
    description: "Book a session tailored to your goals.",
  };
}
