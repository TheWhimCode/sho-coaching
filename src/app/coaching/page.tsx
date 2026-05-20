import type { Metadata } from "next";
import CoachingPageClient from "./CoachingPageClient";

const title = "League of Legends Coaching";
const description =
  "Book 1-on-1 LoL coaching with Sho — VOD reviews, live sessions on Discord, and follow-ups tailored to your rank and goals.";

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
    url: "/coaching",
    type: "website",
  },
  alternates: {
    canonical: "/coaching",
  },
};

export default function Page() {
  return <CoachingPageClient />;
}
