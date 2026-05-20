import type { Metadata } from "next";
import LinkTreePage from "@/app/_components/linktree/LinkTreePage";

export const metadata: Metadata = {
  title: "Mino, Coaching & Skillcheck",
  description:
    "Mino’s website — book League of Legends coaching, play daily challenges and learn more about Mino.",
  alternates: {
    canonical: "/",
  },
};

export default function Home() {
  return <LinkTreePage />;
}
