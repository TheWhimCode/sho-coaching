"use client";

import { useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import ChampionDropdown from "@/app/skillcheck/draft/authoring/ChampDropdown";
import { useFooter } from "@/app/checkout/_components/checkout-steps/FooterContext";

type Props = {
  champion: string | null;
  onChampionChange: (champ: string) => void;
  champion2: string | null;
  onChampion2Change: (champ: string) => void;
  goBack: () => void;
  onSubmit: () => void;
};

export default function StepChampion({
  champion,
  onChampionChange,
  champion2,
  onChampion2Change,
  goBack,
  onSubmit,
}: Props) {
  const [, setFooter] = useFooter();

  useEffect(() => {
    setFooter({
      hidden: false,
      disabled: false,
      label: "Continue",
      onClick: onSubmit,
      loading: false,
    });
    return () => setFooter((s) => ({ ...s, disabled: true }));
  }, [setFooter, onSubmit]);

  return (
    <div className="flex h-full flex-col">
      <div className="mb-3">
        <div className="relative h-7 flex items-center justify-center">
          <button
            type="button"
            onClick={goBack}
            className="absolute left-0 inline-flex items-center gap-1.5 text-sm font-medium text-white/80 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div className="text-sm text-white/80">Champion</div>
        </div>
        <div className="mt-2 border-t border-white/10" />
      </div>

      <div className="flex-1 min-h-0 w-full min-w-0 px-1 flex flex-col gap-4 overflow-visible">
        <div className="flex flex-col gap-1 [&_button]:h-12 [&_button]:text-sm [&_button]:px-3 [&_button]:gap-2 [&_button_.w-7]:w-5 [&_button_.w-7]:h-5 [&_button]:bg-[#0b111c] [&_button]:border-[rgba(146,180,255,0.12)] [&_input]:bg-[#0b111c] [&_input]:border-[rgba(146,180,255,0.12)] [&_[role=listbox]]:bg-[#0b111c] [&_[role=listbox]]:border-[rgba(146,180,255,0.12)] overflow-visible">
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/65">Which champion do you want coaching on?</span>
          </div>
          <ChampionDropdown
            value={champion}
            onChange={onChampionChange}
            className="w-full min-w-0"
            listClassName="max-h-[240px] no-scrollbar"
            placeholderClassName="opacity-50"
            searchClassName="h-12 px-3 text-sm"
            itemClassName="h-10 px-3 text-sm"
          />
        </div>

        <div className="flex flex-col gap-1 [&_button]:h-12 [&_button]:text-sm [&_button]:px-3 [&_button]:gap-2 [&_button_.w-7]:w-5 [&_button_.w-7]:h-5 [&_button]:bg-[#0b111c] [&_button]:border-[rgba(146,180,255,0.12)] [&_input]:bg-[#0b111c] [&_input]:border-[rgba(146,180,255,0.12)] [&_[role=listbox]]:bg-[#0b111c] [&_[role=listbox]]:border-[rgba(146,180,255,0.12)] overflow-visible">
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/65">Second champion (optional)</span>
          </div>
          <ChampionDropdown
            value={champion2}
            onChange={onChampion2Change}
            className="w-full min-w-0"
            listClassName="max-h-[240px] no-scrollbar"
            placeholderClassName="opacity-50"
            searchClassName="h-12 px-3 text-sm"
            itemClassName="h-10 px-3 text-sm"
            disabledValues={champion ? [champion] : []}
            disabled={!champion}
          />
        </div>
      </div>
    </div>
  );
}
