import type { Metadata } from "next";
import LinkTreePage from "@/app/_components/linktree/LinkTreePage";
import { ABOUT_MINO_PRELOAD_IMAGES } from "@/app/_components/linktree/aboutMinoPreload";

export const metadata: Metadata = {
  title: "Mino, Coaching & Skillcheck",
  description: "Some stuff about me :3",
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
