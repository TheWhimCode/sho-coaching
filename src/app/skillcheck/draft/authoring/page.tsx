import type { Metadata } from "next";
import Hero from "@/app/skillcheck/layout/Hero";
import DraftAuthorMain from "./DraftAuthorMain";

export const metadata: Metadata = {
  title: "Skillcheck — Create Draft",
  description: "Create a draft puzzle for the community.",
  openGraph: {
    title: "Skillcheck — Create Draft",
    description: "Create a draft puzzle for the community.",
    type: "website",
  },
};

export default function DraftAuthoringPage() {
  return <Hero hero={<DraftAuthorMain />} />;
}
