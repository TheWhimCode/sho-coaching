"use client";

import React from "react";

export type SpellKey = "Q" | "W" | "E" | "R";

export type SpellPanelSpell = {
  id: string;
  key: SpellKey;
  name: string;
  tooltip?: string; // often HTML from DDragon
  description?: string; // also HTML-ish
  icon: string; // full URL
};

function stripHtml(html: string) {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/?[^>]+(>|$)/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export default function SpellPanelList({
  spells,
  selectedKey,
  className,
  title = "Abilities",
  subtitle,
}: {
  spells: SpellPanelSpell[];
  selectedKey: SpellKey;
  className?: string;
  title?: string;
  subtitle?: string;
}) {
  // Ensure order Q W E R
  const order: Record<SpellKey, number> = { Q: 0, W: 1, E: 2, R: 3 };
  const ordered = [...spells].sort((a, b) => order[a.key] - order[b.key]);

  return (
    <div className={className}>
      {/* Header */}
      <div className="mb-2">
        <div className="text-xl font-semibold leading-tight">
          {title}
        </div>
        {subtitle && (
          <div className="text-sm opacity-70 leading-tight">
            {subtitle}
          </div>
        )}
      </div>

      {/* Ability list */}
      <div className="flex flex-col gap-3">
        {ordered.map((s) => {
          const isSelected = s.key === selectedKey;
          const raw = s.tooltip || s.description || "";
          const text = raw ? stripHtml(raw) : "";

          return (
            <div
              key={s.id}
              className={[
                "rounded-2xl border overflow-hidden transition",
                isSelected
                  ? "border-yellow-400/40"
                  : "border-white/10 opacity-70",
              ].join(" ")}
            >
              {/* Gradient highlight for selected */}
              <div
                className={[
                  "p-4 md:p-5",
                  isSelected
                    ? "bg-[radial-gradient(circle_at_20%_30%,rgba(255,220,120,0.22),transparent_55%),radial-gradient(circle_at_80%_70%,rgba(0,130,255,0.18),transparent_60%)]"
                    : "bg-white/5",
                ].join(" ")}
              >
                {/* IMPORTANT: items-start, not items-center */}
                <div className="flex gap-4 items-start">
                  {/* Icon */}
                  <div className="relative shrink-0 mt-[2px]">
                    <img
                      src={s.icon}
                      alt={`${s.key} ${s.name}`}
                      className={[
                        "w-14 h-14 md:w-16 md:h-16 rounded-xl ring-1 ring-white/10",
                        isSelected ? "" : "grayscale",
                      ].join(" ")}
                    />
                    <div className="absolute -bottom-2 -right-2 rounded-lg px-2 py-1 text-xs font-bold bg-black/70 border border-white/10">
                      {s.key}
                    </div>
                  </div>

                  {/* Text */}
                  <div className="min-w-0 flex-1">
                    <div
                      className={[
                        "font-semibold text-base md:text-lg leading-tight truncate",
                        isSelected ? "text-white" : "text-white/90",
                      ].join(" ")}
                    >
                      {s.name}
                    </div>

                    <div
                      className="
                        mt-[2px]
                        text-sm md:text-[15px]
                        leading-snug
                        whitespace-pre-line
                        opacity-90
                      "
                    >
                      {text || "—"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
