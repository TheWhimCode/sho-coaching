import type { Metadata } from "next";
import LeaderboardClient from "./LeaderboardClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Skillcheck — Leaderboard",
  description: "Top streak leaderboard for Skillcheck",
  openGraph: {
    title: "Skillcheck — Leaderboard",
    description: "Top streak leaderboard for Skillcheck",
    type: "website",
  },
};

export default function LeaderboardPage() {
  return <LeaderboardClient />;
}
