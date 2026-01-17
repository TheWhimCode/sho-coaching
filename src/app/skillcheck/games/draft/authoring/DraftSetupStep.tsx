"use client";

import { useEffect, useState } from "react";
import PrimaryCTA from "@/app/_components/small/buttons/PrimaryCTA";
import ChampionDropdown from "./ChampDropdown";
import SearchDropdown from "@/app/_components/small/SearchDropdown";
import { ROLE_ICONS } from "@/lib/datadragon/roles";

type Role = "top" | "jng" | "mid" | "adc" | "sup";
type Side = "blue" | "red";

export type DraftSetup = {
  role: Role;
  side: Side;
  mainChamp: string;
};

const HEAVY_TEXT_SHADOW =
  "0 0 10px rgba(0,0,0,0.95), 0 0 22px rgba(0,0,0,0.95), 0 0 36px rgba(0,0,0,0.95)";

const ROLE_ITEMS = ([
  "top",
  "jng",
  "mid",
  "adc",
  "sup",
] as Role[]).map((r) => ({
  value: r,
  label: r.toUpperCase(),
  icon: ROLE_ICONS[r],
}));

export default function DraftSetupStep({
  value,
  onComplete,
}: {
  value: DraftSetup | null;
  onComplete: (setup: DraftSetup) => void;
}) {
  const [role, setRole] = useState<Role | null>(
    value?.role ?? null
  );
  const [side, setSide] = useState<Side | null>(
    value?.side ?? null
  );
  const [mainChamp, setMainChamp] = useState<string | null>(
    value?.mainChamp ?? null
  );

  // keep in sync when parent changes value (e.g. going back)
  useEffect(() => {
    setRole(value?.role ?? null);
    setSide(value?.side ?? null);
    setMainChamp(value?.mainChamp ?? null);
  }, [value?.role, value?.side, value?.mainChamp]);

  const canContinue = !!role && !!side && !!mainChamp;

  return (
    <div className="flex flex-col items-center gap-6 mt-16">
      {/* HEADER */}
      <h1
        className="text-3xl md:text-4xl font-semibold text-white text-center"
        style={{ textShadow: HEAVY_TEXT_SHADOW }}
      >
        Make the perfect draft for your main
      </h1>

      {/* ROLE */}
      <div className="w-full flex justify-center">
        <SearchDropdown
          items={ROLE_ITEMS}
          value={role}
          onChange={setRole}
          placeholder="Select your role"
        />
      </div>

      {/* MAIN CHAMP */}
      <div className="w-full flex justify-center">
        <ChampionDropdown value={mainChamp} onChange={setMainChamp} />
      </div>

      {/* TEAM SIDE */}
      <div className="flex gap-2 mt-0">
        <button
          onClick={() => setSide("blue")}
          className={[
            "px-10 py-4 rounded-lg border-2 text-lg font-semibold transition",
            side === "blue"
              ? "border-blue-400 bg-blue-500/20 text-blue-200"
              : "border-blue-400/60 bg-blue-500/10 text-blue-300 hover:bg-blue-500/20",
          ].join(" ")}
        >
          BLUE SIDE
        </button>

        <button
          onClick={() => setSide("red")}
          className={[
            "px-10 py-4 rounded-lg border-2 text-lg font-semibold transition",
            side === "red"
              ? "border-red-400 bg-red-500/20 text-red-200"
              : "border-red-400/60 bg-red-500/10 text-red-300 hover:bg-red-500/20",
          ].join(" ")}
        >
          RED SIDE
        </button>
      </div>

      {/* CTA */}
      <PrimaryCTA
        className="px-8 py-3 text-lg"
        disabled={!canContinue}
        onClick={() =>
          onComplete({
            role: role!,
            side: side!,
            mainChamp: mainChamp!,
          })
        }
      >
        Continue
      </PrimaryCTA>
    </div>
  );
}
