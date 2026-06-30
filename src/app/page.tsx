import type { Metadata } from "next";
import LinkTreePage from "@/app/_components/linktree/LinkTreePage";
import { ABOUT_MINO_PRELOAD_IMAGES } from "@/app/_components/linktree/aboutMinoPreload";

export const metadata: Metadata = {
  title: "Mino, Coaching & Skillcheck",
  description:
    "Mino’s website — book League of Legends coaching, play daily challenges and learn more about Mino.",
  alternates: {
    canonical: "/",
  },
};

export default function Home() {
  return (
    <>
      {ABOUT_MINO_PRELOAD_IMAGES.map((href) => (
        <link key={href} rel="preload" as="image" href={href} />
      ))}
      <LinkTreePage />
    </>
  );
}
