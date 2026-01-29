// app/skillcheck/page.tsx
import type { Metadata } from "next";
import SkillcheckClient from "./SkillcheckClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Skillcheck",
  description: "Challenge and expand your League of Legends knowledge",
  openGraph: {
    title: "Skillcheck",
    description: "Challenge and expand your League of Legends knowledge",
    type: "website",
  },
};

export default function SkillcheckPage() {
  return <SkillcheckClient />;
}
