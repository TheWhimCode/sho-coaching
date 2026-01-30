"use client";

import { useRouter } from "next/navigation";
import Hero from "@/app/skillcheck/layout/Hero";
import {
  Swords,
  Hourglass,
  Gem,
  Sparkles,
  Hand,
} from "lucide-react";
import DividerWithLogo from "@/app/_components/small/Divider-logo";

const modes = [
  {
    key: "draft",
    label: "Draft",
    href: "/skillcheck/draft",
    icon: Swords,
    desc: "Pick the correct champion for the draft",
    available: true,
  },
  {
    key: "cooldowns",
    label: "Cooldowns",
    href: "/skillcheck/cooldowns",
    icon: Hourglass,
    desc: "Guess the cooldown of a champ",
    available: true,
  },
  {
    key: "items",
    label: "Items",
    href: "/skillcheck/items",
    icon: Gem,
    desc: "How much do you need for your spike?",
    available: true,
  },
  {
    key: "runes",
    label: "Runes",
    href: "/skillcheck/runes",
    icon: Sparkles,
    desc: "Coming soon",
    available: false,
  },
  {
    key: "timers",
    label: "Timers",
    href: "/skillcheck/timers",
    icon: Sparkles,
    desc: "Coming soon",
    available: false,
  },
] as const;

export default function SkillcheckClient() {
  const router = useRouter();

  return (
    <Hero
      hero={
        <div className="w-full max-w-xl mx-auto text-center">
          {/* Header */}
          <h1 className="text-5xl md:text-6xl font-semibold tracking-tight">
            <span className="bg-gradient-to-b from-white to-white/70 bg-clip-text text-transparent">
              Skillcheck
            </span>
          </h1>
          
          <p className="mt-3 text-sm md:text-base opacity-70">
            Choose a mode
          </p>
            <DividerWithLogo className="mt-6" />

          {/* Panels */}
          <div className="mt-8 flex flex-col gap-2">
            {modes.map((m) => {
              const Icon = m.icon;
              return (
                <button
                  key={m.key}
                  onClick={() => m.available && router.push(m.href)}
                  disabled={!m.available}
                  className={[
                    "group w-full rounded-2xl border px-5 py-4 transition",
                    "border-white/10 bg-slate-900/80 hover:bg-slate-800/80",
                    m.available
                      ? "cursor-pointer"
                      : "cursor-not-allowed opacity-60 hover:bg-neutral-900/80",
                  ].join(" ")}
                >
                  <div className="flex items-center gap-4 text-left">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/30 bg-black/40">
                      <Icon className="h-5 w-5 opacity-90" />
                    </div>

                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <div className="font-semibold text-lg">
                          {m.label}
                        </div>
                        {!m.available && (
                          <span className="rounded-full border border-white/10 bg-black/40 px-2 py-0.5 text-xs opacity-80">
                            Soon
                          </span>
                        )}
                      </div>
                      <div className="text-sm opacity-70 text-left">
                        {m.desc}
                      </div>
                    </div>

                    <div className="text-sm opacity-60 group-hover:opacity-90 transition">
                      →
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      }
      content={null}
    />
  );
}
