"use client";

import Hero from "@/app/skillcheck/layout/Hero";
import SuccessOverlay from "@/app/skillcheck/components/SuccessOverlay";
import { useEffect, useRef, useState } from "react";
import ItemsHero from "./ItemsHero";
import ItemsOptions from "./ItemsOptions";
import ItemsResult from "./ItemsResult";

// ✅ Data Dragon preload
import {
  ensureDDragonItems,
  getItemDescriptionHtml,
} from "@/lib/datadragon/itemdescriptions";

/* ---------------------------------
   Shared item shape for results
---------------------------------- */
export type ResultItem = {
  id: string;
  name: string;
  icon: string;
  description?: string;
  priceTotal?: number;
  from?: {
    id: string;
    name: string;
    icon: string;
    priceTotal?: number;
  }[];
};

export default function ItemsClient({
  targets,
  inventory,
  trueGold,
  storageKey,
  avgAttempts,
}: {
  targets: ResultItem[];
  inventory: { id: string; name: string; icon: string }[];
  trueGold: number;
  storageKey: string;
  avgAttempts: string;
}) {
  const [showSuccess, setShowSuccess] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [completed, setCompleted] = useState(false);

  // ✅ Preloaded DDragon html (description + stats)
  const [preloadedDescHtml, setPreloadedDescHtml] = useState<string>("");

  const resultRef = useRef<HTMLDivElement | null>(null);
  const hasScrolledRef = useRef(false);

  const SHOW_AND_SCROLL_DELAY_MS = 2500;

  const item = targets[0];

  /* -------------------------
     Preload item description
     (runs while user is still guessing)
  -------------------------- */
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        await ensureDDragonItems("en_US");
        if (!alive) return;
        setPreloadedDescHtml(
          getItemDescriptionHtml(item?.id) ?? ""
        );
      } catch {
        if (!alive) return;
        setPreloadedDescHtml("");
      }
    })();

    return () => {
      alive = false;
    };
  }, [item?.id]);

  /* -------------------------
     Restore completion state
  -------------------------- */
  useEffect(() => {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return;

    try {
      const s = JSON.parse(raw);
      const isCompleted = !!s.completed;
      setCompleted(isCompleted);

      if (isCompleted) setShowSuccess(true);

      if (isCompleted && !hasScrolledRef.current) {
        hasScrolledRef.current = true;
        setTimeout(() => {
          setShowResult(true);
          requestAnimationFrame(() =>
            resultRef.current?.scrollIntoView({
              behavior: "smooth",
              block: "center",
            })
          );
        }, SHOW_AND_SCROLL_DELAY_MS);
      }
    } catch {}
  }, [storageKey]);

  function revealAndScrollToResult() {
    if (hasScrolledRef.current) return;
    hasScrolledRef.current = true;

    setTimeout(() => {
      setShowResult(true);
      requestAnimationFrame(() =>
        resultRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        })
      );
    }, SHOW_AND_SCROLL_DELAY_MS);
  }

  return (
    <>
      {showSuccess && (
        <SuccessOverlay
          durationMs={1900}
          text={`${trueGold}g`}
          onDone={() => setShowSuccess(false)}
        />
      )}

      <Hero
        hero={<ItemsHero targets={targets} inventory={inventory} />}
        content={
          <>
            <ItemsOptions
              targets={targets}
              inventory={inventory}
              trueGold={trueGold}
              storageKey={storageKey}
              onSolved={() => {
                if (completed) return;

                setCompleted(true);
                setShowSuccess(true);

                try {
                  const raw = localStorage.getItem(storageKey);
                  const s = raw ? JSON.parse(raw) : {};
                  localStorage.setItem(
                    storageKey,
                    JSON.stringify({ ...s, completed: true })
                  );
                } catch {
                  localStorage.setItem(
                    storageKey,
                    JSON.stringify({ completed: true })
                  );
                }

                revealAndScrollToResult();
              }}
            />

            <div ref={resultRef}>
              {showResult && (
                <ItemsResult
                  targets={targets}
                  inventory={inventory}
                  trueGold={trueGold}
                  avgAttempts={avgAttempts}
                  storageKey={storageKey}
                  preloadedDescHtml={preloadedDescHtml}
                />
              )}
            </div>
          </>
        }
      />
    </>
  );
}
