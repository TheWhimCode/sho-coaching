"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

/**
 * Stripe returns to `/speed-reviews?priority=success`. We avoid `useSearchParams()` here —
 * it can throw or misbehave on client-side navigations unless every layout boundary
 * provides Suspense; reading `window.location` in an effect is stable for SPA + full load.
 */
export default function SpeedReviewsPriorityListener({
  onPrioritySuccess,
}: {
  onPrioritySuccess: () => void;
}) {
  const pathname = usePathname();

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const q = new URLSearchParams(window.location.search);
    if (q.get("priority") === "success") {
      onPrioritySuccess();
    }
  }, [pathname, onPrioritySuccess]);

  return null;
}
