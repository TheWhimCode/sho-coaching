"use client";

import { useEffect, useState } from "react";
import BuildPickerClient from "../build/BuildPickerClient";
import type { PickerBuild, PickerItem } from "@/lib/guides/buildPicker/builds";
import { DEFAULTS, barrierShieldScore, extraShieldScore, scoreTeams, steelcapsDurabilityBonus, teamShieldScore, type Settings, type TestChampion } from "./scoring";

const STORAGE = "temporary-build-scoring-v3";
const CONTROLS: { key: keyof Settings; label: string; max: number; step?: number }[] = [
  { key: "shield", label: "Minimum shields for Serpent’s", max: 30 },
  { key: "earlyShield", label: "Early shields for Serpent’s first", max: 30 },
  { key: "lethalityMax", label: "Full lethality: maximum durability", max: 25, step: 0.5 },
  { key: "bastionMax", label: "Bastionbreaker: maximum durability", max: 30, step: 0.5 },
  { key: "titansMin", label: "Titansbane: minimum base durability", max: 25 },
  { key: "forgedMomentumMax", label: "Forged Momentum: both teams below this damage", max: 25 },
  { key: "hubrisCcMin", label: "Hubris: allied CC must reach this", max: 25 },
  { key: "physicalMin", label: "Allied physical champions to consider Steelcaps", max: 5 },
  { key: "magicDamageMax", label: "Magic damage below this enables Steelcaps", max: 25 },
  { key: "steelcapsBonus", label: "Extra durability per Steelcaps enemy", max: 5, step: 0.5 },
];

function TeamScores({ label, team, steelApplies = false, steelBonus = 1 }: { label: string; team: TestChampion[]; steelApplies?: boolean; steelBonus?: number }) {
  return <div className="min-w-0 rounded-lg">
    <table className="w-full table-fixed border-collapse text-left text-xs tabular-nums [&_th]:px-2 [&_td]:px-2 [&_th]:py-1.5 [&_td]:py-1.5">
      <caption className="px-2 py-2 text-left font-semibold text-[#B8D8EA]">{label}</caption>
      <colgroup><col className="w-[22%]" /><col className="w-[14%]" /><col className="w-[12%]" /><col className="w-[9%]" /><col className="w-[9%]" /><col className="w-[10%]" /><col className="w-[8%]" /><col className="w-[16%]" /></colgroup>
      <thead className="text-[11px] text-[#B8D8EA]/75"><tr style={{ borderBottom: "1px solid #493b4b" }}>
        {["Champion", "Durability", "Shields", "Timing", "Type", "Damage", "CC", "Steelcaps"].map(title => <th key={title} scope="col" className="px-3 py-2 font-medium">{title}</th>)}
      </tr></thead>
      <tbody>{team.map(c => {
        const steel = steelcapsDurabilityBonus(c, steelApplies, steelBonus);
        return <tr key={c.name} style={{ borderBottom: "1px solid #493b4b" }}>
        <th scope="row" title={c.name} className="truncate px-3 py-2 font-medium">{c.name}</th>
        <td className="whitespace-nowrap px-3 py-2">{c.durabilityScore}{steel > 0 && <span className="ml-1 text-[10px] text-[#B8D8EA]" title={`Steelcaps: +${steelBonus} durability`} aria-label={`plus ${steelBonus} Steelcaps durability`}>+{steelBonus} Steel</span>}</td>
        <td className="whitespace-nowrap px-3 py-2">{c.shieldScore}{barrierShieldScore(c) > 0 && <span className="ml-1 text-[10px] text-[#B8D8EA]" title="Barrier: +1 early shield point" aria-label="plus Barrier, 1 early shield point">+ Bar</span>}{extraShieldScore(c) > barrierShieldScore(c) && <span className="ml-1 text-[10px] text-[#B8D8EA]" title="Guardian: +1 early shield point" aria-label="plus Guardian, 1 early shield point">+ Gua</span>}</td>
        <td className="px-3 py-2 text-xs opacity-65">{c.shieldTiming === "Late" ? "Late" : ""}</td>
        <td className="px-3 py-2 text-xs opacity-65">{c.damageType}</td>
        <td className="px-3 py-2">{c.damageScore}</td>
        <td className="px-3 py-2">{c.ccScore ?? "—"}</td>
        <td className="px-3 py-2 text-xs opacity-65">{c.canBuildSteelcaps === null ? "—" : c.canBuildSteelcaps ? "Yes" : "No"}</td>
      </tr>;
      })}</tbody>
      <tfoot className="font-semibold"><tr>
        <th scope="row" className="px-3 py-3">Total</th>
        <td className="px-3 py-3">{team.reduce((sum, c) => sum + c.durabilityScore + steelcapsDurabilityBonus(c, steelApplies, steelBonus), 0)}</td>
        <td className="px-3 py-3">{teamShieldScore(team)}</td>
        <td /><td />
        <td className="px-3 py-3">{team.reduce((sum, c) => sum + c.damageScore, 0)}</td>
        <td className="px-3 py-3">{team.reduce((sum, c) => sum + (c.ccScore ?? 0), 0)}</td>
        <td />
      </tr></tfoot>
    </table>
  </div>;
}

export default function Playground({ allies, enemies, builds, bootItems }: {
  allies: TestChampion[]; enemies: TestChampion[]; builds: PickerBuild[]; bootItems: PickerItem[];
}) {
  const [settings, setSettings] = useState(DEFAULTS);
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE) ?? "null");
      if (!saved || typeof saved !== "object") return;
      const next = { ...DEFAULTS };
      for (const control of CONTROLS) {
        const value = saved[control.key];
        if (typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= control.max) next[control.key] = value;
      }
      setSettings(next);
    } catch { /* Use defaults when storage is unavailable. */ }
  }, []);
  const update = (next: Settings) => {
    setSettings(next);
    try { localStorage.setItem(STORAGE, JSON.stringify(next)); } catch { /* Session-only settings. */ }
  };
  const score = scoreTeams(allies, enemies, settings);
  const result = {
    status: "in_game" as const, mock: true, riotId: "Development#TEST", platform: "euw1",
    queue: "Random composition test", gameStartedAt: null, playerSide: "blue" as const,
    blue: allies, red: enemies, recommendation: score.recommendation,
  };
  return <>
    <section aria-label="Composition summary" className="mx-auto max-w-5xl px-4 pt-24 text-[#F5EDE6] sm:px-8">
      <div className="flex flex-wrap items-start justify-between gap-3 text-sm">
        <div>
          <p>Enemy durability: <strong>{score.durability}{score.steelApplies ? ` + ${score.adjustment} Steelcaps = ${score.adjusted}` : ` = ${score.adjusted}`}</strong></p>
          <p className="mt-1 text-[#B8D8EA]/75">Shields including Barrier: {score.early + score.late} ({score.early} early, {score.late} late) · Allied physical: {score.physical}/5 · Allied magic damage: {score.magicDamage} · Steelcaps enemies: {score.eligible}</p>
        </div>
        <button className="rounded-lg border border-[#F0ABCF]/30 px-4 py-2 text-[#F0ABCF]" onClick={() => window.location.reload()}>New composition</button>
      </div>
    </section>
    <BuildPickerClient builds={builds} bootItems={bootItems} championRows={[]} preview={result} />
    <section aria-label="Composition scores and settings" className="mx-auto max-w-5xl space-y-3 px-4 pb-16 text-[#F5EDE6] sm:px-8">
      <div className="overflow-x-auto"><div className="grid min-w-[980px] grid-cols-2 gap-3">
        <TeamScores label="Allies" team={allies} />
        <TeamScores label="Enemies" team={enemies} steelApplies={score.steelApplies} steelBonus={settings.steelcapsBonus} />
      </div></div>
      <details className="rounded-xl border border-white/15 p-4">
        <summary className="cursor-pointer font-semibold">Adjust scoring thresholds</summary>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{CONTROLS.map(control => <label key={control.key} className="text-xs">
          {control.label}<input type="number" min={0} max={control.max} step={control.step ?? 1} value={settings[control.key]}
            onChange={event => { const value = event.target.valueAsNumber; if (Number.isFinite(value)) update({ ...settings, [control.key]: Math.max(0, Math.min(control.max, value)) }); }}
            className="mt-1 block w-full rounded border border-white/20 bg-[#241A29] p-2 text-base" />
        </label>)}</div>
        <button className="mt-4 text-sm underline" onClick={() => update({ ...DEFAULTS })}>Reset provisional thresholds</button>
      </details>
      <details className="text-sm">
        <summary className="cursor-pointer text-[#B8D8EA]/75">Scoring details</summary>
        <p className="mt-2 text-sm text-[#B8D8EA]">{score.reason}</p>
        {score.recommendation.alternative && <p className="mt-2 text-sm text-[#E8C676]">{score.recommendation.reason}</p>}
      <p className="text-xs opacity-65">Same rules as the live picker. Shaco, Evelynn, or Rengar recommend Shadow Economy unless base durability reaches Titansbane. If both teams’ damage is below 12, Forged Momentum is next. Otherwise shield threshold first, then durability. Enough shields without the early threshold pick Reckoning. Shieldbreaker’s Path is only an alternative. Three or more allied physical champions with allied magic damage below 6 add +1 Steel durability to every Steelcaps-eligible enemy. Steelcaps points never trigger Titansbane. If allied CC is below 8, Hubris builds flip to their alternative as the primary pick. Role pools are approximate.</p>
      </details>
    </section>
  </>;
}
