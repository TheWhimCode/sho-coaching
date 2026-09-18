// src/app/quickbook/page.tsx

import { redirect } from "next/navigation";
import QuickbookClient from "./QuickbookClient";
import { COACHING_SALES_ENABLED } from "@/lib/coaching/coachingSales";

export const dynamic = "force-dynamic";

export default function QuickbookPage() {
  if (!COACHING_SALES_ENABLED) {
    redirect("/coaching");
  }

  return (
    <QuickbookClient
      sessionType="Session"
      liveMinutes={60}
      followups={0}
      liveBlocks={0}
    />
  );
}