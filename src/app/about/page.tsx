import type { Metadata } from "next";
import { ABOUT_MINO_PRELOAD_IMAGES } from "@/app/_components/linktree/aboutMinoPreload";
import { ABOUT_HERO_VIDEO } from "@/lib/coaching/coachingClipVideos";
import AboutMinoClient from "./AboutMinoClient";

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
  return (
    <>
      <link rel="preload" as="video" href={ABOUT_HERO_VIDEO} />
      {ABOUT_MINO_PRELOAD_IMAGES.map((href) => (
        <link key={href} rel="preload" as="image" href={href} />
      ))}
      <AboutMinoClient />
    </>
  );
}
