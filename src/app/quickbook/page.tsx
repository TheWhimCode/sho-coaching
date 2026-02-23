// src/app/quickbook/page.tsx

import QuickbookClient from "./QuickbookClient";

export const dynamic = "force-dynamic";

export default function QuickbookPage() {
  return (
    <QuickbookClient
      sessionType="Session"
      liveMinutes={60}
      followups={0}
      liveBlocks={0}
    />
  );
}