import clsx from "clsx";
import { Swords } from "lucide-react";
import type { GuideComboAbilityKey, GuideViegoAbilityIcons } from "@/lib/guides/comboGuideTypes";

export const guideComboAbilityIconClass =
  "size-10 shrink-0 rounded-lg object-cover ring-1 ring-[#B8D8EA]/15 sm:size-11";

type ResolvedComboStep = {
  spellKey: "Q" | "W" | "E" | "R" | null;
  badge: string;
  alt: string;
  wVariant?: "tap" | "charge";
};

function resolveComboStep(step: GuideComboAbilityKey): ResolvedComboStep {
  switch (step) {
    case "AA":
      return { spellKey: null, badge: "AA", alt: "Auto attack" };
    case "Wtap":
      return { spellKey: "W", badge: "W", alt: "Viego W tap", wVariant: "tap" };
    case "Wcharge":
      return { spellKey: "W", badge: "W", alt: "Viego W charge", wVariant: "charge" };
    default:
      return { spellKey: step, badge: step, alt: `Viego ${step}` };
  }
}

function AbilityKeyBadge({ label }: { label: string }) {
  return (
    <div className="absolute -bottom-1.5 -right-1.5 z-10 rounded-md border border-[#F0ABCF]/25 bg-[#16121A]/92 px-1.5 py-0.5 text-[0.62rem] font-bold leading-none text-[#FAD4E8] shadow-sm sm:text-[0.65rem]">
      {label}
    </div>
  );
}

function WVariantLabel({ variant }: { variant: "tap" | "charge" }) {
  return (
    <span className="absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded border border-[#F0ABCF]/22 bg-[#16121A]/95 px-1 py-px text-[0.48rem] font-bold uppercase leading-none tracking-wide text-[#B8D8EA] shadow-sm sm:text-[0.52rem]">
      {variant}
    </span>
  );
}

function ComboAbilityStep({
  step,
  abilityIcons,
}: {
  step: GuideComboAbilityKey;
  abilityIcons: GuideViegoAbilityIcons;
}) {
  const resolved = resolveComboStep(step);

  return (
    <div className="relative shrink-0 isolate">
      {resolved.spellKey === null ? (
        <div
          className={clsx(
            guideComboAbilityIconClass,
            "flex items-center justify-center border border-[#F0ABCF]/22 bg-gradient-to-br from-[#4A354F] to-[#1E1724]"
          )}
          aria-hidden
        >
          <Swords className="size-5 text-[#FAD4E8]/88 sm:size-6" strokeWidth={2.25} />
        </div>
      ) : (
        <>
          <img
            src={abilityIcons[resolved.spellKey]}
            alt={resolved.alt}
            loading="lazy"
            decoding="async"
            className={guideComboAbilityIconClass}
          />
          {resolved.wVariant ? <WVariantLabel variant={resolved.wVariant} /> : null}
        </>
      )}
      <AbilityKeyBadge label={resolved.badge} />
    </div>
  );
}

export default function ComboSequenceBar({
  sequence,
  abilityIcons,
}: {
  sequence: GuideComboAbilityKey[];
  abilityIcons: GuideViegoAbilityIcons;
}) {
  if (sequence.length === 0) return null;

  return (
    <div className="mb-3 flex flex-wrap items-center gap-1.5 sm:gap-2" aria-label="Combo sequence">
      {sequence.map((step, index) => (
        <span key={`${index}-${step}`} className="flex items-center gap-1.5 sm:gap-2">
          {index > 0 ? (
            <span
              className="select-none px-0.5 text-base font-semibold text-[#B8D8EA]/85 sm:text-lg"
              aria-hidden
            >
              ›
            </span>
          ) : null}
          <ComboAbilityStep step={step} abilityIcons={abilityIcons} />
        </span>
      ))}
    </div>
  );
}
