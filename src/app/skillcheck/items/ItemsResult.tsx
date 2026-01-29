"use client";

import { useEffect, useMemo, useState } from "react";
import ResultsScreen, {
  DifficultyUI,
} from "@/app/skillcheck/components/ResultScreen";

// ✅ Data Dragon item descriptions
import {
  ensureDDragonItems,
  getItemDescriptionHtml,
} from "@/lib/datadragon/itemdescriptions";

type ItemDTO = {
  id: string;
  name: string;
  icon: string;
  description?: string;
  priceTotal?: number;
  from?: { id: string; name: string; icon: string; priceTotal?: number }[];
};

function getItemsDifficulty(avgAttempts: string): DifficultyUI {
  const avg = Number(avgAttempts);
  if (!Number.isFinite(avg)) {
    return { label: "—", color: "border-white/20 text-white/60" };
  }

  return avg <= 3.0
    ? { label: "Easy", color: "border-green-400/40 text-green-400" }
    : avg <= 5.0
    ? { label: "Tricky", color: "border-blue-500/40 text-blue-500" }
    : avg <= 7.0
    ? { label: "Hard", color: "border-orange-400/40 text-orange-400" }
    : { label: "Nightmare", color: "border-red-700/50 text-red-700" };
}

// Prefer item.priceTotal; fallback to sum of component totals.
function getFullItemPrice(item?: ItemDTO): number | null {
  if (!item) return null;
  if (Number.isFinite(item.priceTotal as number))
    return item.priceTotal as number;

  if (Array.isArray(item.from) && item.from.length > 0) {
    const sum = item.from.reduce((acc, c) => acc + (c.priceTotal ?? 0), 0);
    return sum > 0 ? sum : null;
  }

  return null;
}

export default function ItemsResult({
  targets,
  inventory,
  trueGold,
  avgAttempts,
  storageKey,
  preloadedDescHtml,
}: {
  targets: ItemDTO[];
  inventory: { id: string; name: string; icon: string }[];
  trueGold: number;
  avgAttempts: string;
  storageKey: string;
  /** Optional: pass preloaded DDragon html to avoid pop-in on first paint */
  preloadedDescHtml?: string;
}) {
  const [descHtml, setDescHtml] = useState<string>(preloadedDescHtml ?? "");

  const difficulty = useMemo(
    () => getItemsDifficulty(avgAttempts),
    [avgAttempts]
  );

  const item = targets[0];
  const fullPrice = useMemo(() => getFullItemPrice(item), [item]);

  // ✅ If parent provides/updates preload later, sync it in
  useEffect(() => {
    if (typeof preloadedDescHtml === "string") {
      setDescHtml(preloadedDescHtml);
    }
  }, [preloadedDescHtml]);

  // ✅ Load Data Dragon description ONLY if not preloaded
  useEffect(() => {
    if (descHtml) return;

    let alive = true;

    (async () => {
      try {
        await ensureDDragonItems("en_US");
        if (!alive) return;
        setDescHtml(getItemDescriptionHtml(item?.id) ?? "");
      } catch {
        if (!alive) return;
        setDescHtml("");
      }
    })();

    return () => {
      alive = false;
    };
  }, [item?.id, descHtml]);

  // ✅ Split DDragon html into a "stats" column + "body" column (best-effort)
  const { statsHtml, bodyHtml } = useMemo(() => {
    const html = descHtml ?? "";
    const m = html.match(/<stats\b[^>]*>[\s\S]*?<\/stats>/i);
    const stats = m?.[0] ?? "";
    const body = stats ? html.replace(stats, "").trim() : html.trim();
    return { statsHtml: stats, bodyHtml: body };
  }, [descHtml]);

  return (
    <ResultsScreen
      avgAttempts={avgAttempts}
      difficulty={difficulty}
      header={
        <div className="relative py-6 md:py-8">
          <img
            src={item.icon}
            alt=""
            aria-hidden
            className="
              absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
              w-24 h-24 md:w-32 md:h-32
              saturate-150
              object-cover
              pointer-events-none
              select-none
            "
            style={{
              WebkitMaskImage:
                "radial-gradient(circle at center, black 60%, transparent 95%)",
              maskImage:
                "radial-gradient(circle at center, black 60%, transparent 95%)",
            }}
          />

          <div className="relative flex justify-center">
            <div className="text-center text-3xl md:text-4xl font-semibold leading-tight">
              <span className="opacity-95">{item?.name}</span>
              {fullPrice != null && (
                <>
                  <span className="mx-2 ">—</span>
                  <span className="font-black tabular-nums">{fullPrice}g</span>
                </>
              )}
            </div>
          </div>
        </div>
      }
    >
      {/* Stats (col 1) + Description (col 2) in a 3-col grid */}
      <div className="mt-0 px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {/* Stats column */}
          <div className="md:col-span-1 md:mt-14">
            {statsHtml ? (
              <div
                className="
                  text-white/85 leading-relaxed
                  [&_br]:block [&_br]:content-[''] [&_br]:my-2
                  [&_attention]:text-white [&_attention]:font-semibold
                  [&_stats]:text-white/90 [&_stats]:font-semibold
                  [&_passive]:text-white/90 [&_passive]:font-semibold
                  [&_active]:text-white/90 [&_active]:font-semibold
                  [&_unique]:text-white/70
                "
                dangerouslySetInnerHTML={{ __html: statsHtml }}
              />
            ) : (
              <div className="text-white/50">—</div>
            )}
          </div>

          {/* Description column */}
          <div className="md:col-span-2">
            {bodyHtml ? (
              <div
                className="
                  text-white/80 leading-relaxed
                  [&_br]:block [&_br]:content-[''] [&_br]:my-2
                  [&_attention]:text-white [&_attention]:font-semibold
                  [&_stats]:text-white/90 [&_stats]:font-semibold
                  [&_passive]:text-white/90 [&_passive]:font-semibold
                  [&_active]:text-white/90 [&_active]:font-semibold
                  [&_unique]:text-white/70
                "
                dangerouslySetInnerHTML={{ __html: bodyHtml }}
              />
            ) : (
              <div className="text-white/50">—</div>
            )}
          </div>
        </div>

        {/* Components */}
        {Array.isArray(item.from) && item.from.length > 0 && (
          <div className="mt-6">
            <div className="text-sm uppercase tracking-wide text-white/60 mb-2">
              Components
            </div>

            <div className="flex flex-wrap gap-3">
              {item.from.map((c, i) => (
  <div key={`${c.id}-${i}`}
                  className="flex flex-col items-center gap-1 rounded-xl border border-white/10 bg-black/30 p-2"
                  title={c.name}
                >
                  <img
                    src={c.icon}
                    alt={c.name}
                    className="w-12 h-12 rounded-lg"
                  />
                  <div className="text-xs font-semibold tabular-nums text-white/80">
                    {c.priceTotal ? `${c.priceTotal}g` : "—"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </ResultsScreen>
  );
}
