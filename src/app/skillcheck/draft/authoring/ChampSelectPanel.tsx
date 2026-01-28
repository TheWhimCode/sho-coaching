"use client";

import { useEffect, useMemo, useState } from "react";
import { champSquareUrlById, getAllChampions } from "@/lib/datadragon";

function normalizeName(input: string) {
  return input.replace(/[’‘]/g, "'").replace(/\s+/g, " ").trim();
}

type ChampionEntry = {
  id: string; // DDragon ID for images (e.g. "MonkeyKing")
  name: string; // Display name (e.g. "Wukong")
};

function isChampionEntryArray(x: unknown): x is ChampionEntry[] {
  return (
    Array.isArray(x) &&
    x.length > 0 &&
    typeof (x as any)[0] === "object" &&
    (x as any)[0] !== null &&
    typeof (x as any)[0].id === "string" &&
    typeof (x as any)[0].name === "string"
  );
}

function isStringArray(x: unknown): x is string[] {
  return Array.isArray(x) && (x.length === 0 || typeof x[0] === "string");
}

export default function ChampSelectPanel({
  onHover,
  onSelect,
  disabledChamps = [],
}: {
  onHover: (champ: string | null) => void;
  onSelect: (champ: string | null) => void;
  disabledChamps?: string[];
}) {
  const [query, setQuery] = useState("");
  const [champions, setChampions] = useState<ChampionEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Treat return type as unknown here so we can safely normalize either shape.
    (getAllChampions() as unknown as Promise<unknown>)
      .then((list) => {
        if (!mounted) return;

        let normalized: ChampionEntry[] = [];

        if (isChampionEntryArray(list)) {
          normalized = list;
        } else if (isStringArray(list)) {
          normalized = list.map((s) => ({ id: s, name: s }));
        } else {
          console.error("getAllChampions returned unexpected shape:", list);
        }

        setChampions(normalized);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load champions:", err);
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const disabledSet = useMemo(
    () => new Set(disabledChamps.map((c) => normalizeName(c).toLowerCase())),
    [disabledChamps]
  );

  const filtered = useMemo(() => {
    const q = normalizeName(query).toLowerCase();
    if (!q) return champions;

    return champions.filter((c) =>
      normalizeName(c.name).toLowerCase().includes(q)
    );
  }, [champions, query]);

  return (
    <div
      className="
        w-[660px] h-[380px]
        bg-black/60 backdrop-blur-md
        rounded-xl border border-white/10
        p-4 flex flex-col
      "
    >
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search champion…"
        className="
          mb-3 px-3 py-2 rounded-md
          bg-black/40 border border-white/10
          text-white text-sm outline-none
        "
      />

      <div
        className="
          flex-1 overflow-y-auto
          grid grid-cols-8 gap-2
          no-scrollbar
        "
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        {/* clear slot */}
        <button
          onMouseEnter={() => onHover(null)}
          onMouseLeave={() => onHover(null)}
          onClick={() => onSelect(null)}
          className="
            w-16 h-16 rounded-lg
            bg-gray-800 border border-gray-600
            flex items-center justify-center
            text-gray-400 text-xl font-semibold
            hover:bg-gray-700
          "
          title="Clear slot"
        >
          ⦸
        </button>

        {loading && (
          <div className="col-span-7 text-center text-sm text-gray-400">
            Loading champions…
          </div>
        )}

        {!loading &&
          filtered.map(({ id, name: rawName }) => {
            const name = normalizeName(rawName);
            const isDisabled = disabledSet.has(name.toLowerCase());

            return (
              <button
                key={id}
onMouseEnter={() => !isDisabled && onHover(id)}
onClick={() => {
  if (!isDisabled) onSelect(id);
}}

                disabled={isDisabled}
                className={[
                  "w-16 h-16 rounded-lg overflow-hidden transition",
                  isDisabled
                    ? "opacity-30 grayscale cursor-not-allowed"
                    : "hover:scale-105",
                ].join(" ")}
                title={isDisabled ? "Already selected" : name}
              >
                <img
                  src={champSquareUrlById(id)}
                  alt={name}
                  className="w-full h-full object-cover"
                />
              </button>
            );
          })}
      </div>
    </div>
  );
}
