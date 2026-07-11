"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { guideSectionHeaderPadClass } from "@/lib/guides/guideTheme";

export default function GuideDonationSection() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showThanks, setShowThanks] = useState(false);

  useEffect(() => {
    if (searchParams.get("donated") === "1") {
      setShowThanks(true);
    }
  }, [searchParams]);

  async function handleDonate() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/stripe/donation/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = (await res.json().catch(() => null)) as { url?: string } | null;
      if (!res.ok || !data?.url) {
        setError("Could not start checkout. Try again in a moment.");
        return;
      }

      const opened = window.open(data.url, "_blank", "noopener,noreferrer");
      if (!opened) {
        setError("Pop-up blocked. Allow pop-ups for this site and try again.");
      }
    } catch {
      setError("Could not start checkout. Try again in a moment.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={guideSectionHeaderPadClass}>
      {showThanks ? (
        <p className="mb-4 text-center text-sm font-medium text-[#FAD4E8] sm:text-base">
          Thank you for the support — you&apos;re a real one.
        </p>
      ) : null}

      <div className="flex flex-col items-center">
        <p className="text-center text-lg font-semibold text-[#FAD4E8] sm:text-xl md:text-2xl">
          The guide is free so I&apos;m still poor 😐
        </p>

        <button
          type="button"
          onClick={handleDonate}
          disabled={loading}
          className="mt-5 inline-flex items-center justify-center rounded-full border-2 border-[#F0ABCF] bg-[#FAD4E8] px-6 py-3 text-sm font-bold text-[#4A354F] shadow-[0_0_24px_rgba(250,212,232,0.55)] transition hover:border-[#F5C4DC] hover:bg-[#FCE8F2] hover:text-[#2A1F2E] hover:shadow-[0_0_30px_rgba(240,171,207,0.5)] disabled:cursor-not-allowed disabled:opacity-60 sm:px-7 sm:text-base"
        >
          {loading ? "Opening..." : "Donate"}
        </button>

        {error ? <p className="mt-3 text-center text-sm text-[#F87171]">{error}</p> : null}
      </div>
    </div>
  );
}
