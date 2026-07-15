import type { Metadata } from "next";
import LinkTreePage from "@/app/_components/linktree/LinkTreePage";

export const metadata: Metadata = {
  title: "Mino, Coaching & Skillcheck",
  description: "Some stuff about me :3",
  alternates: {
    canonical: "/",
  },
};

export default function Home() {
  return <LinkTreePage />;
}
