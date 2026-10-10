"use client";

import clsx from "clsx";
import GuideImage from "@/app/_components/guides/GuideImage";
import type { PickerItem } from "@/lib/guides/buildPicker/builds";
import type { TreeTraceStep } from "@/lib/guides/buildPicker/decisionTree";

const LABEL_CLASS = "text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-[#B8D8EA]/70";

/** Keep this order identical to `recommendedBoots` in decisionTree.ts. */
const BOOT_RULES: {
  id: string;
  when: string;
  itemId: number;
  slot: 2 | 3 | 4;
}[] = [
  {
    id: "b1",
    when: "Survivability build, 4+ enemy AP, and 3+ enemy High CC",
    itemId: 3111,
    slot: 2,
  },
  { id: "b2", when: "4+ enemy AD", itemId: 3047, slot: 2 },
  { id: "b3", when: "Survivability build", itemId: 3047, slot: 3 },
  { id: "b4", when: "4+ enemy Squishy", itemId: 3009, slot: 4 },
  { id: "b5", when: "Anything else", itemId: 3008, slot: 4 },
];

const BOOT_TITLES: Record<number, string> = {
  3008: "Gluttonous Greaves",
  3009: "Boots of Swiftness",
  3047: "Plated Steelcaps",
  3111: "Mercury's Treads",
};

const SLOT_LABEL: Record<2 | 3 | 4, string> = {
  2: "2nd",
  3: "3rd",
  4: "4th",
};

type Props = {
  bootItems: PickerItem[];
  trace?: TreeTraceStep[];
  activeBoot?: { itemId: number; slot: 2 | 3 | 4 };
};

export default function BootsLogicView({ bootItems, trace, activeBoot }: Props) {
  const step = trace?.find((entry) => entry.nodeId === "boots");
  const evaluated = Boolean(trace?.length);

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-10">
      <section className="rounded-2xl border border-[#F5E6D3]/12 bg-white/[0.03] px-5 py-5">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h3 className="text-lg font-bold tracking-tight text-[#F5E6D3]">Which boots?</h3>
            <p className="mt-1 text-xs leading-relaxed text-[#F5E6D3]/50">
              First matching line wins, after the build is chosen. The number is where the boots sit in the item order.
            </p>
          </div>
          {step ? (
            <p className="rounded-full bg-[#F0ABCF]/15 px-3 py-1 text-xs font-medium text-[#FAD4E8] ring-1 ring-[#F0ABCF]/30">
              {step.detail}
            </p>
          ) : null}
        </div>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-[#B8D8EA]/60">
              <th className="pb-2 font-semibold">If</th>
              <th className="pb-2 font-semibold">Boots</th>
            </tr>
          </thead>
          <tbody>
            {BOOT_RULES.map((row) => {
              const hit = evaluated && step?.ruleId === row.id;
              const item = bootItems.find((entry) => entry.id === row.itemId);
              const name = BOOT_TITLES[row.itemId] ?? item?.name ?? String(row.itemId);
              return (
                <tr key={row.id} className={clsx("border-t border-[#F5E6D3]/10", hit && "bg-[#F0ABCF]/[0.1]")}>
                  <td className={clsx("py-2.5 pr-4", hit ? "text-[#FAD4E8]" : "text-[#F5E6D3]/80")}>{row.when}</td>
                  <td className="py-2.5">
                    <span className="inline-flex items-center gap-2">
                      {item ? (
                        <span className="h-6 w-6 overflow-hidden rounded-[4px] bg-[#352839] ring-1 ring-[#F5E6D3]/15">
                          <GuideImage src={item.icon} alt="" className="h-full w-full object-cover" />
                        </span>
                      ) : null}
                      <span className={clsx("font-medium", hit ? "text-[#FAD4E8]" : "text-[#F5E6D3]")}>{name}</span>
                      <span className="text-xs text-[#F5E6D3]/45">{SLOT_LABEL[row.slot]}</span>
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <div>
        <p className={LABEL_CLASS}>Boots</p>
        <ul className="mt-3 divide-y divide-[#F5E6D3]/10 rounded-2xl border border-[#F5E6D3]/12 bg-white/[0.03]">
          {[3008, 3009, 3047, 3111].map((id) => {
            const item = bootItems.find((entry) => entry.id === id);
            const active = activeBoot?.itemId === id;
            const name = BOOT_TITLES[id] ?? item?.name ?? String(id);
            return (
              <li key={id} className={clsx("flex items-center gap-4 px-4 py-3.5", active && "bg-[#B8D8EA]/[0.08]")}>
                <span className="h-8 w-8 shrink-0 overflow-hidden rounded-md bg-[#352839] ring-1 ring-[#F5E6D3]/15">
                  {item ? <GuideImage src={item.icon} alt={name} className="h-full w-full object-cover" /> : null}
                </span>
                <div className="min-w-0 flex-1">
                  <p className={clsx("text-sm font-semibold", active ? "text-[#CFE6F3]" : "text-[#F5E6D3]")}>{name}</p>
                  <p className="mt-0.5 text-xs text-[#F5E6D3]/45">
                    {id === 3047 ? "2nd, or 3rd on the survivability build" : id === 3111 ? "2nd item" : "4th item"}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
