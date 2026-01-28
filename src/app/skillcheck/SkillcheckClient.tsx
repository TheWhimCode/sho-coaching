"use client";

import { useRouter } from "next/navigation";
import Hero from "@/app/skillcheck/layout/Hero";

const modes = [
  { key: "draft", label: "Draft", href: "/skillcheck/draft" },
  { key: "cooldowns", label: "Cooldowns", href: "/skillcheck/cooldowns" },
  { key: "items", label: "Items", href: "/skillcheck/items" },
  { key: "runes", label: "Runes", href: "/skillcheck/runes" },
  { key: "mechanics", label: "Mechanics", href: "/skillcheck/mechanics" },
];

export default function SkillcheckClient() {
  const router = useRouter();

  return (
    <Hero
      hero={
        <div className="w-full">
          <h1 className="text-3xl md:text-4xl font-semibold">Skillcheck</h1>
          <p className="mt-2 opacity-80">Choose a mode.</p>
        </div>
      }
      content={
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {modes.map((m) => (
            <button
              key={m.key}
              onClick={() => router.push(m.href)}
              className="rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition px-5 py-4 text-left"
            >
              <div className="font-semibold text-lg">{m.label}</div>
              <div className="text-sm opacity-70">
                {m.key === "draft"
                  ? "Play the drafting game"
                  : "Coming soon"}
              </div>
            </button>
          ))}
        </div>
      }
    />
  );
}
