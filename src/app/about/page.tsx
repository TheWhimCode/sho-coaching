import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ABOUT_MINO_PRELOAD_IMAGES } from "@/app/_components/linktree/aboutMinoPreload";
import AboutMinoClient from "./AboutMinoClient";

const IS_DEV = process.env.NODE_ENV === "development";

const title = "About Mino";
const description =
  "Meet Mino — soft kitten, femboy vtuber, and Challenger jungle coach with 5+ years of experience.";

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
    url: "/about",
    type: "profile",
  },
  alternates: {
    canonical: "/about",
  },
};

export default function AboutPage() {
  if (!IS_DEV) notFound();

  return (
    <>
      <link rel="preload" as="video" href="/videos/about/ChallPromotionthinner.webm" />
      {ABOUT_MINO_PRELOAD_IMAGES.map((href) => (
        <link key={href} rel="preload" as="image" href={href} />
      ))}
      <AboutMinoClient />
    </>
  );
}
