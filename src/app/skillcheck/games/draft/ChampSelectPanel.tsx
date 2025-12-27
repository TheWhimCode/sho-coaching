"use client";

import { useEffect, useMemo, useState } from "react";
import {
  champSquareUrlById,
  resolveChampionId,
  getAllChampions,
} from "@/lib/datadragon";

function normalizeName(input: string) {
  return input
    .replace(/[’‘]/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export default function ChampSelectPanel({
  onHover,
  onSelect,
}: {
  onHover: (champ: string | null) => void;
  onSelect: (champ: string | null) => void;
}) {
  const [query, setQuery] = useState("");
  const [champions, setChampions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    getAllChampions()
      .then((list) => {
        if (!mounted) return;
        setChampions(list);
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

  const filtered = useMemo(() => {
    const q = normalizeName(query).toLowerCase();
    if (!q) return champions;

    return champions.filter((c) =>
      normalizeName(c).toLowerCase().includes(q)
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
          scrollbarWidth: "none", // Firefox
          msOverflowStyle: "none", // IE/Edge legacy
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
          filtered.map((raw) => {
            const name = normalizeName(raw);
            const id = resolveChampionId(name);

            return (
              <button
                key={name}
                onMouseEnter={() => onHover(name)}
                onMouseLeave={() => onHover(null)}
                onClick={() => onSelect(name)}
                className="
                  w-16 h-16 rounded-lg overflow-hidden
                  hover:scale-105 transition
                "
                title={name}
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
