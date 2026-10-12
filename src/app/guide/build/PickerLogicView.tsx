"use client";

import clsx from "clsx";
import GuideImage from "@/app/_components/guides/GuideImage";
import type { PickerBuild } from "@/lib/guides/buildPicker/builds";
import type { TreeTraceStep } from "@/lib/guides/buildPicker/decisionTree";

const LABEL_CLASS = "text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-[#B8D8EA]/70";

type RuleRow = {
  id: string;
  when: string;
  buildId: string | null;
  buildLabel: string;
};

const SHADOW_ECONOMY_RULES: RuleRow[] = [
  {
    id: "u1",
    when: "Enemy Shaco, Evelynn, or Rengar, and durability below Titansbane",
    buildId: "umbral-collector",
    buildLabel: "Shadow Economy",
  },
  { id: "u2", when: "Anything else", buildId: null, buildLabel: "Otherwise continue" },
];

const LOW_DAMAGE_RULES: RuleRow[] = [
  {
    id: "d1",
    when: "Enemy damage below 12 and allied damage below 12",
    buildId: "yun-tal-ldr",
    buildLabel: "Forged Momentum",
  },
  { id: "d2", when: "Anything else", buildId: null, buildLabel: "Otherwise continue" },
];

const SHIELD_RULES: RuleRow[] = [
  { id: "s1", when: "Shield total 7+ and early 7+", buildId: "sit-serpents-first", buildLabel: "Shieldbreaker's Edge" },
  { id: "s4", when: "Shield total 7+", buildId: "sit-serpents-late", buildLabel: "Shieldbreaker's Reckoning" },
  { id: "s6", when: "Anything else", buildId: null, buildLabel: "→ How tanky?" },
];

const TANKY_RULES: RuleRow[] = [
  { id: "t3", when: "Base durability 15+", buildId: "hubris-ldr", buildLabel: "Titansbane" },
  { id: "t1", when: "Adjusted durability 7 or below", buildId: "bastionbreaker-cyclosword", buildLabel: "The twink crusher" },
  { id: "t2", when: "Adjusted durability 12 or below", buildId: "main-bastionbreaker", buildLabel: "Bread & Butter Carnage" },
  { id: "t4", when: "Anything else", buildId: "main-hubris", buildLabel: "Another Bloodrush" },
];

const HUBRIS_CC_RULES: RuleRow[] = [
  {
    id: "c1",
    when: "Allied CC below 8",
    buildId: null,
    buildLabel: "Use the Hubris alternative as primary",
  },
  { id: "c2", when: "Anything else", buildId: null, buildLabel: "Keep Hubris" },
];

type Props = {
  builds: PickerBuild[];
  trace?: TreeTraceStep[];
  activeBuildId?: string;
};

export default function PickerLogicView({ builds, trace, activeBuildId }: Props) {
  const shadowStep = trace?.find((step) => step.nodeId === "shadow-economy");
  const lowDamageStep = trace?.find((step) => step.nodeId === "low-damage-dps");
  const shieldStep = trace?.find((step) => step.nodeId === "shields");
  const tankyStep = trace?.find((step) => step.nodeId === "tanky");
  const hubrisCcStep = trace?.find((step) => step.nodeId === "allied-cc");
  const evaluated = Boolean(trace?.length);

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-10">
      <div className="space-y-6">
        <CheckBlock
          title="1. Shadow Economy?"
          note="First matching line wins. Shaco, Evelynn, or Rengar recommend Umbral Glaive unless enemy durability already reaches Titansbane."
          rows={SHADOW_ECONOMY_RULES}
          step={shadowStep}
          evaluated={evaluated}
          builds={builds}
        />
        <CheckBlock
          title="2. Enough room to DPS?"
          note="Still evaluated after an earlier pick so the breakdown can show that route. Enemy damage and allied damage must both sit below 12."
          rows={LOW_DAMAGE_RULES}
          step={lowDamageStep}
          evaluated={evaluated}
          skipped={evaluated && !lowDamageStep}
          builds={builds}
        />
        <CheckBlock
          title="3. How much shield?"
          note="Still evaluated after an earlier pick. Shield total uses each champion's shield score, plus Barrier and Guardian as early points. Late-tagged scores stay late. Shieldbreaker's Path is only an alternative, never the primary pick."
          rows={SHIELD_RULES}
          step={shieldStep}
          evaluated={evaluated}
          skipped={evaluated && !shieldStep}
          builds={builds}
        />
        <CheckBlock
          title="4. How tanky?"
          note="Still evaluated after an earlier pick. Adjusted durability adds Steelcaps points when you have 3+ physical allies and allied magic damage below 6. Steelcaps never counts toward Titansbane."
          rows={TANKY_RULES}
          step={tankyStep}
          evaluated={evaluated}
          skipped={evaluated && !tankyStep}
          builds={builds}
        />
        <CheckBlock
          title="5. Hubris setup?"
          note="Runs when a Hubris build was picked, including later hypothetical durability checks. Allied CC below 8 makes Titansbane into Inevitable Doom, and Another Bloodrush into Shadow Economy. Hubris stays as the alternative."
          rows={HUBRIS_CC_RULES}
          step={hubrisCcStep}
          evaluated={evaluated}
          skipped={evaluated && !hubrisCcStep}
          builds={builds}
        />
      </div>

      <div>
        <p className={LABEL_CLASS}>All builds</p>
        <ul className="mt-3 divide-y divide-[#F5E6D3]/10 rounded-2xl border border-[#F5E6D3]/12 bg-white/[0.03]">
          {builds.filter((build) => build.id !== "sit-serpents").map((build) => {
            const active = activeBuildId === build.id;
            return (
              <li
                key={build.id}
                className={clsx(
                  "flex items-center gap-4 px-4 py-3.5",
                  active && "bg-[#B8D8EA]/[0.08]"
                )}
              >
                <div className="min-w-0 flex-1">
                  <p className={clsx("text-sm font-semibold", active ? "text-[#CFE6F3]" : "text-[#F5E6D3]")}>
                    {build.label}
                  </p>
                  <p className="mt-0.5 text-xs text-[#F5E6D3]/45">{build.summary || build.id}</p>
                </div>
                <ol className="flex shrink-0 gap-1" aria-label={`${build.label} items`}>
                  {build.items.map((item, index) => (
                    <li
                      key={`${index}-${item.id}`}
                      className="h-8 w-8 overflow-hidden rounded-md bg-[#352839] ring-1 ring-[#F5E6D3]/15"
                      title={`${index + 1}. ${item.name}`}
                    >
                      <GuideImage src={item.icon} alt={item.name} className="h-full w-full object-cover" />
                    </li>
                  ))}
                </ol>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function CheckBlock({
  title,
  note,
  rows,
  step,
  evaluated,
  skipped,
  builds,
}: {
  title: string;
  note: string;
  rows: RuleRow[];
  step?: TreeTraceStep;
  evaluated: boolean;
  skipped?: boolean;
  builds: PickerBuild[];
}) {
  const hypothetical = Boolean(step?.hypothetical);

  return (
    <section
      className={clsx(
        "rounded-2xl border px-5 py-5",
        skipped
          ? "border-[#F5E6D3]/8 bg-white/[0.02] opacity-45"
          : hypothetical
            ? "border-[#B8D8EA]/12 bg-white/[0.025]"
            : "border-[#F5E6D3]/12 bg-white/[0.03]"
      )}
    >
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h3 className="text-lg font-bold tracking-tight text-[#F5E6D3]">{title}</h3>
          <p className="mt-1 text-xs leading-relaxed text-[#F5E6D3]/50">{note}</p>
        </div>
        {step && !hypothetical ? (
          <p className="rounded-full bg-[#F0ABCF]/15 px-3 py-1 text-xs font-medium text-[#FAD4E8] ring-1 ring-[#F0ABCF]/30">
            {step.detail}
          </p>
        ) : step && hypothetical ? (
          <p className="rounded-full bg-[#B8D8EA]/10 px-3 py-1 text-xs font-medium text-[#B8D8EA]/80 ring-1 ring-[#B8D8EA]/25">
            Would pick: {step.optionLabel}
          </p>
        ) : skipped ? (
          <p className="text-xs text-[#F5E6D3]/40">Skipped</p>
        ) : null}
      </div>
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-[#B8D8EA]/60">
            <th className="pb-2 font-semibold">If the enemy team has</th>
            <th className="pb-2 font-semibold">Build</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const hit = Boolean(step && !hypothetical && step.ruleId === row.id);
            const would = Boolean(hypothetical && step?.ruleId === row.id);
            const build = row.buildId ? builds.find((entry) => entry.id === row.buildId) : undefined;
            return (
              <tr
                key={row.id}
                className={clsx(
                  "border-t border-[#F5E6D3]/10",
                  hit && "bg-[#F0ABCF]/[0.1]",
                  would && "bg-[#B8D8EA]/[0.06]"
                )}
              >
                <td className={clsx("py-2.5 pr-4", hit ? "text-[#FAD4E8]" : "text-[#F5E6D3]/80")}>{row.when}</td>
                <td className="py-2.5">
                  <span className="inline-flex items-center gap-2">
                    {build ? (
                      <span className="flex gap-0.5">
                        {build.items.slice(0, 5).map((item, index) => (
                          <span
                            key={`${index}-${item.id}`}
                            className="h-6 w-6 overflow-hidden rounded-[4px] bg-[#352839] ring-1 ring-[#F5E6D3]/15"
                          >
                            <GuideImage src={item.icon} alt="" className="h-full w-full object-cover" />
                          </span>
                        ))}
                      </span>
                    ) : (
                      <span className={clsx("text-[#F5E6D3]/35", hit && "text-[#FAD4E8]/50")}>↓</span>
                    )}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}
