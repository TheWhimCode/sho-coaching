"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";

/** Isolated so `useSearchParams` does not suspend the whole speed-reviews page tree. */
export default function SpeedReviewsPriorityListener({
  onPrioritySuccess,
}: {
  onPrioritySuccess: () => void;
}) {
  const sp = useSearchParams();

  React.useEffect(() => {
    if (sp.get("priority") === "success") {
      onPrioritySuccess();
    }
  }, [sp, onPrioritySuccess]);

  return null;
}
