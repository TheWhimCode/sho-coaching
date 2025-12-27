"use client";

import { useEffect, useState } from "react";
import DraftReviewCard from "./DraftReviewCard";

export default function AdminDraftsPage() {
  const [drafts, setDrafts] = useState<any[]>([]);
  const [current, setCurrent] = useState<any | null>(null);

  useEffect(() => {
    fetch("/api/admin/skillcheck/drafts/pending")
      .then((r) => r.json())
      .then((list) => {
        setDrafts(list);
        setCurrent(
          list.length
            ? list[Math.floor(Math.random() * list.length)]
            : null
        );
      });
  }, []);

  function advance() {
    const remaining = drafts.filter(
      (d) => d.id !== current?.id
    );

    setDrafts(remaining);

    setCurrent(
      remaining.length
        ? remaining[Math.floor(Math.random() * remaining.length)]
        : null
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-8">
      <h1 className="text-3xl font-semibold text-white mb-8">
        Pending Draft Review
      </h1>

      {!current && (
        <div className="text-white/70 text-lg">
          No pending drafts 🎉
        </div>
      )}

      {current && (
        <DraftReviewCard
          draft={current}
          onDone={advance}
        />
      )}
    </div>
  );
}
