import type { Metadata } from "next";
import LinkTreePage from "@/app/_components/linktree/LinkTreePage";

export const metadata: Metadata = {
  title: "Coaching, Streams & Skillcheck",
  description:
    "Sho’s home on the web — book League of Legends coaching, join the Discord, watch streams, or play daily Skillcheck.",
  alternates: {
    canonical: "/",
  },
};

export default function Home() {
  return <LinkTreePage />;
}
