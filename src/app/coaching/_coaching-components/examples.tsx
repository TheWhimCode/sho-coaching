// coaching/_coaching-components/CoachingExamples.tsx
"use client";

import React from "react";
import SquareButton from "@/app/_components/small/SquareButton";

type ExampleItem = {
  role: "Top" | "Jungle" | "Mid" | "ADC" | "Support";
  href: string;
  src: string; // single composite image for the button
};

const items: ExampleItem[] = [
  { role: "Top",     href: "https://www.patreon.com/yourpatreon/posts?filters[tag]=Top%20Free",     src: "/images/squarebuttons/Jax2.png" },
  { role: "Jungle",  href: "https://www.patreon.com/posts/108659798",  src: "/images/squarebuttons/Shyvana7.png" },
  { role: "Mid",     href: "https://www.patreon.com/posts/syndra-emerald-113265874",     src: "/images/squarebuttons/Syndra8.png" },
  { role: "ADC",     href: "https://www.patreon.com/posts/jhin-emerald-107308126",     src: "/images/squarebuttons/Jhin2.png" },
  { role: "Support", href: "https://www.patreon.com/posts/nami-diamond-2-113193138", src: "/images/squarebuttons/Nami.png" },
];

export default function CoachingExamples() {
  return (
    <section className="relative">
      <div className="max-w-7xl pl-6 lg:pl-[calc((min(100vw,80rem)-72rem)/2+1.5rem)] pr-4 md:pr-6">
        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_auto] items-center gap-8 md:gap-10">
          <div className="min-w-0">
            <h2 className="text-2xl md:text-3xl font-semibold">Need an example?</h2>
            <p className="mt-2 text-white/70 text-sm md:text-base">
              Watch some of Shos coaching sessions for free on Patreon.
            </p>
            <p className="mt-2 text-xs text-white/50">Top, Jungle, Mid, ADC, Support.</p>
          </div>

          <div className="min-w-0">
            <div className="flex flex-nowrap gap-4 overflow-x-auto md:overflow-visible">
              {items.map((item) => (
                <SquareButton
                  key={item.role}
                  role={item.role}
                  href={item.href}
                  src={item.src}
                  size={120} // ← increased size (try 160–192 as needed)
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
