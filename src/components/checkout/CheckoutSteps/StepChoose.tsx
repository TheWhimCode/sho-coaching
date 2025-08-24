"use client";

import PaymentChooser from "@/components/checkout/PaymentChooser";

type Props = {
  goBack: () => void;
  onChoose: (m: string) => void;
};

export default function StepChoose({ goBack, onChoose }: Props) {
  return (
    <div className="h-full flex flex-col rounded-xl p-4 ring-1 ring-white/12 bg-white/[.04]">
      <div className="mb-3">
        <div className="relative h-7 flex items-center justify-center">
          <button onClick={goBack} className="absolute left-0 text-sm text-white/80 hover:text-white">← Back</button>
          <div className="text-sm text-white/80">Choose payment</div>
        </div>
        <div className="mt-2 border-t border-white/10" />
      </div>
      <div className="flex-1">
        <PaymentChooser mode="choose" onChoose={onChoose} />
      </div>
    </div>
  );
}
