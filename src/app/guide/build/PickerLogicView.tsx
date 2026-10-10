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

const SHIELD_RULES: RuleRow[] = [
  { id: "s1", when: "2+ High shields", buildId: "sit-serpents-first", buildLabel: "Shieldbreaker's Edge" },
  { id: "s2", when: "1 High and 2+ Low or Late", buildId: "sit-serpents-first", buildLabel: "Shieldbreaker's Edge" },
  { id: "s3", when: "4+ Low (early)", buildId: "sit-serpents-first", buildLabel: "Shieldbreaker's Edge" },
  { id: "s4", when: "4+ Low+Late, and more Late than Low", buildId: "sit-serpents-late", buildLabel: "Shieldbreaker's Reckoning" },
  { id: "s5", when: "4+ Low+Late otherwise", buildId: "sit-serpents", buildLabel: "Shieldbreaker's Path" },
  { id: "s6", when: "Anything else", buildId: null, buildLabel: "→ Survivability?" },
];

const SURVIVABILITY_RULES: RuleRow[] = [
  {
    id: "v1",
    when: "Enemy jungle Talon or Rengar, your team has ≤2 small shields and 0 High, enemy has 3+ AD",
    buildId: "collector-shieldbow",
    buildLabel: "Survivability (Collector into Shieldbow)",
  },
  { id: "v2", when: "Anything else", buildId: null, buildLabel: "→ How tanky?" },
];

const TANKY_RULES: RuleRow[] = [
  { id: "t1", when: "4+ Squishy and 0 Tanky", buildId: "bastionbreaker-cyclosword", buildLabel: "The twink crusher" },
  { id: "t2", when: "Exactly 2 Bruiser, or 4 Squishy + 1 Tanky", buildId: "main-bastionbreaker", buildLabel: "Bread & Butter Carnage" },
  { id: "t3", when: "2+ Tanky, or 3+ Bruiser+Tanky combined", buildId: "hubris-ldr", buildLabel: "Titansbane" },
  { id: "t4", when: "Anything else", buildId: "main-hubris", buildLabel: "Another Bloodrush" },
];

type Props = {
  builds: PickerBuild[];
  trace?: TreeTraceStep[];
  activeBuildId?: string;
};

export default function PickerLogicView({ builds, trace, activeBuildId }: Props) {
  const shieldStep = trace?.find((step) => step.nodeId === "shields");
  const survivabilityStep = trace?.find((step) => step.nodeId === "survivability");
  const tankyStep = trace?.find((step) => step.nodeId === "tanky");
  const evaluated = Boolean(trace?.length);

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-10">
      <div className="space-y-6">
        <CheckBlock
          title="1. How much shield?"
          note="First matching line wins. Low, Late, and Barrier each count as a small shield. Barrier counts as early."
          rows={SHIELD_RULES}
          step={shieldStep}
          evaluated={evaluated}
          builds={builds}
        />
        <CheckBlock
          title="2. Survivability?"
          note="Only runs if shields did not pick a Serpent's build. Jungle is whoever has Smite."
          rows={SURVIVABILITY_RULES}
          step={survivabilityStep}
          evaluated={evaluated}
          skipped={evaluated && !survivabilityStep}
          builds={builds}
        />
        <CheckBlock
          title="3. How tanky?"
          note="Only runs if shields and survivability did not pick a build. If your team has 3+ AD, the enemy is counted as one extra Bruiser (one Squishy converted). Viego counts."
          rows={TANKY_RULES}
          step={tankyStep}
          evaluated={evaluated}
          skipped={evaluated && !tankyStep}
          builds={builds}
        />
      </div>

      <div>
        <p className={LABEL_CLASS}>All builds</p>
        <ul className="mt-3 divide-y divide-[#F5E6D3]/10 rounded-2xl border border-[#F5E6D3]/12 bg-white/[0.03]">
          {builds.map((build) => {
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
  return (
    <section
      className={clsx(
        "rounded-2xl border px-5 py-5",
        skipped ? "border-[#F5E6D3]/8 bg-white/[0.02] opacity-45" : "border-[#F5E6D3]/12 bg-white/[0.03]"
      )}
    >
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h3 className="text-lg font-bold tracking-tight text-[#F5E6D3]">{title}</h3>
          <p className="mt-1 text-xs leading-relaxed text-[#F5E6D3]/50">{note}</p>
        </div>
        {step ? (
          <p className="rounded-full bg-[#F0ABCF]/15 px-3 py-1 text-xs font-medium text-[#FAD4E8] ring-1 ring-[#F0ABCF]/30">
            {step.detail}
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
            const hit = step?.ruleId === row.id;
            const build = row.buildId ? builds.find((entry) => entry.id === row.buildId) : undefined;
            return (
              <tr
                key={row.id}
                className={clsx(
                  "border-t border-[#F5E6D3]/10",
                  hit && "bg-[#F0ABCF]/[0.1]"
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
