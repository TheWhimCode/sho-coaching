"use client";

import clsx from "clsx";
import { Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import GuideImage from "@/app/_components/guides/GuideImage";
import type { ChampionProfileRow } from "@/lib/guides/buildPicker/types";
import { guideChampionIconImgClass } from "@/lib/guides/guideTheme";

type TraitKey = "durabilityScore" | "canBuildSteelcaps" | "mercuryTreadsScore" | "shieldScore" | "shieldTiming" | "damageType" | "damageScore" | "ccScore";

const TRAIT_COLUMNS: { key: TraitKey; label: string; options: string[] }[] = [
  { key: "durabilityScore", label: "Durability", options: ["1", "2", "3", "4", "5", "Unrated"] },
  { key: "canBuildSteelcaps", label: "Steelcaps", options: ["Yes", "No", "Unrated"] },
  { key: "mercuryTreadsScore", label: "Mercs", options: ["1", "2", "3", "Unrated"] },
  { key: "shieldScore", label: "Shield score", options: ["0", "1", "2", "3", "4", "5"] },
  { key: "shieldTiming", label: "Shield timing", options: ["Late"] },
  { key: "damageType", label: "Type", options: ["AD", "AP", "Mixed"] },
  { key: "damageScore", label: "Damage", options: ["1", "2", "3", "4", "5", "Unrated"] },
  { key: "ccScore", label: "CC", options: ["1", "2", "3", "4", "5", "Unrated"] },
];

/** Pill colors per value — muted for "None/Low", warm for mid, cool/pink for high. */
const PILL_STYLES: Record<string, string> = {
  // damage type
  AD: "bg-[#F97316]/15 text-[#FDBA74] ring-[#F97316]/30",
  AP: "bg-[#A855F7]/15 text-[#D8B4FE] ring-[#A855F7]/30",
  Mixed: "bg-[#22D3EE]/12 text-[#A5F3FC] ring-[#22D3EE]/30",
  // levels
  None: "bg-[#F5E6D3]/[0.06] text-[#F5E6D3]/45 ring-[#F5E6D3]/10",
  Low: "bg-[#F5E6D3]/[0.08] text-[#F5E6D3]/70 ring-[#F5E6D3]/15",
  "1": "bg-[#F5E6D3]/[0.08] text-[#F5E6D3]/70 ring-[#F5E6D3]/15",
  "2": "bg-[#E8C676]/10 text-[#E8D4A4]/80 ring-[#E8C676]/20",
  Late: "bg-[#B8D8EA]/12 text-[#CFE6F3]/85 ring-[#B8D8EA]/25",
  Medium: "bg-[#E8C676]/15 text-[#F3DCA0] ring-[#E8C676]/30",
  "3": "bg-[#E8C676]/15 text-[#F3DCA0] ring-[#E8C676]/30",
  "4": "bg-[#F0ABCF]/12 text-[#F0C4DC] ring-[#F0ABCF]/25",
  High: "bg-[#F0ABCF]/18 text-[#FAD4E8] ring-[#F0ABCF]/35",
  "5": "bg-[#F0ABCF]/18 text-[#FAD4E8] ring-[#F0ABCF]/35",
};

function traitValue(row: ChampionProfileRow, key: TraitKey): string {
  const value = row[key];
  if (key === "shieldTiming") return String(value ?? "");
  if (value === null) return "Unrated";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}

function TraitPill({ value }: { value: string }) {
  return (
    <span
      className={clsx(
        "inline-flex min-w-[4.5rem] justify-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1",
        PILL_STYLES[value] ?? "bg-[#F5E6D3]/[0.08] text-[#F5E6D3]/70 ring-[#F5E6D3]/15"
      )}
    >
      {value}
    </span>
  );
}

const SELECT_CLASS =
  "h-9 rounded-lg border border-[#F0ABCF]/15 bg-[#1E1724]/80 px-2.5 text-xs font-medium text-[#F5EDE6] outline-none transition focus:border-[#F0ABCF]/50";

export default function ChampionProfileTable({ rows }: { rows: ChampionProfileRow[] }) {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<Partial<Record<TraitKey, string>>>({});

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (q && !row.name.toLowerCase().includes(q)) return false;
      for (const column of TRAIT_COLUMNS) {
        const wanted = filters[column.key];
        if (wanted && traitValue(row, column.key) !== wanted) return false;
      }
      return true;
    });
  }, [rows, query, filters]);

  const hasFilters = query.trim() !== "" || Object.values(filters).some(Boolean);

  return (
    <div className="rounded-2xl border border-[#F0ABCF]/15 bg-[#2A1F2E]/80 ring-1 ring-[#B8D8EA]/10 backdrop-blur-sm">
      <div className="flex flex-wrap items-center gap-2 border-b border-[#F0ABCF]/12 p-3 sm:p-4">
        <div className="relative flex min-w-[12rem] flex-1 items-center">
          <Search className="pointer-events-none absolute left-3 h-3.5 w-3.5 text-[#F5E6D3]/35" aria-hidden />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search champion"
            aria-label="Search champion"
            className="h-9 w-full rounded-lg border border-[#F0ABCF]/15 bg-[#1E1724]/80 pl-8 pr-3 text-sm text-[#F5EDE6] outline-none transition placeholder:text-[#F5E6D3]/30 focus:border-[#F0ABCF]/50"
          />
        </div>
        {TRAIT_COLUMNS.map((column) => (
          <select
            key={column.key}
            aria-label={`Filter ${column.label}`}
            value={filters[column.key] ?? ""}
            onChange={(event) =>
              setFilters((prev) => ({ ...prev, [column.key]: event.target.value || undefined }))
            }
            className={SELECT_CLASS}
          >
            <option value="" className="bg-[#1E1724]">
              {column.label}: all
            </option>
            {column.options.map((option) => (
              <option key={option} value={option} className="bg-[#1E1724]">
                {option}
              </option>
            ))}
          </select>
        ))}
        {hasFilters ? (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setFilters({});
            }}
            className="inline-flex h-9 items-center gap-1 rounded-lg px-2.5 text-xs font-medium text-[#B8D8EA] transition hover:bg-[#B8D8EA]/10"
          >
            <X className="h-3.5 w-3.5" aria-hidden />
            Clear
          </button>
        ) : null}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[40rem] border-collapse text-left">
          <thead>
            <tr className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-[#B8D8EA]/65">
              <th scope="col" className="px-4 py-3 font-semibold sm:px-5">
                Champion
              </th>
              {TRAIT_COLUMNS.map((column) => (
                <th key={column.key} scope="col" className="px-3 py-3 text-center font-semibold">
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F0ABCF]/[0.08]">
            {filtered.map((row) => (
              <tr key={row.name} className="transition-colors hover:bg-[#F0ABCF]/[0.05]">
                <th scope="row" className="px-4 py-2 font-normal sm:px-5">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 shrink-0 overflow-hidden rounded-md ring-1 ring-[#F5E6D3]/15">
                      <GuideImage
                        src={row.icon}
                        alt=""
                        loading="lazy"
                        className={guideChampionIconImgClass}
                      />
                    </div>
                    <span className="text-sm font-semibold text-[#F5EDE6]">{row.name}</span>
                  </div>
                </th>
                {TRAIT_COLUMNS.map((column) => (
                  <td key={column.key} className="px-3 py-2 text-center">
                    {column.key === "shieldTiming" && !row.shieldTiming
                      ? null
                      : <TraitPill value={traitValue(row, column.key)} />}
                  </td>
                ))}
              </tr>
            ))}
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={TRAIT_COLUMNS.length + 1} className="px-5 py-10 text-center text-sm text-[#F5E6D3]/50">
                  No champions match.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <p className="border-t border-[#F0ABCF]/12 px-4 py-2.5 text-xs text-[#F5E6D3]/45 sm:px-5">
        Showing {filtered.length} of {rows.length}
      </p>
    </div>
  );
}
