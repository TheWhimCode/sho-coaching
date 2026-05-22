// coaching/_coaching-components/CoachingExamples.tsx
"use client";

import React from "react";
import SquareButton from "@/app/_components/small/SquareButton";
import { COACHING_EXAMPLE_IMAGES } from "@/app/coaching/coachingPageAssets";

type ExampleItem = {
  role: "Top" | "Jungle" | "Mid" | "ADC" | "Support";
  href: string;
  src: string;
};

const items: ExampleItem[] = [
  { role: "Top", href: "https://www.patreon.com/posts/144158074", src: COACHING_EXAMPLE_IMAGES[0] },
  { role: "Jungle", href: "https://www.patreon.com/posts/108659798", src: COACHING_EXAMPLE_IMAGES[1] },
  { role: "Mid", href: "https://www.patreon.com/posts/syndra-emerald-113265874", src: COACHING_EXAMPLE_IMAGES[2] },
  { role: "ADC", href: "https://www.patreon.com/posts/144983179", src: COACHING_EXAMPLE_IMAGES[3] },
  { role: "Support", href: "https://www.patreon.com/posts/nami-diamond-2-113193138", src: COACHING_EXAMPLE_IMAGES[4] },
];
export default function CoachingExamples() {
  return (
    <section className="relative">
      <div className="max-w-7xl pl-6 lg:pl-[calc((min(100vw,80rem)-72rem)/2+1.5rem)] pr-4 md:pr-6">
        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_auto] items-center gap-2 md:gap-10">
          <div className="min-w-0">
            <h2 className="text-2xl md:text-3xl font-semibold">Need an example?</h2>
            <p className="mt-2 text-white/70 text-sm md:text-base">
              Watch some of my coaching sessions for free on Patreon.
            </p>
            <p className="mt-2 text-xs text-white/50 hidden md:block">
              Get a feeling for my coaching style in real sessions.
            </p>
          </div>

          <div className="min-w-0">
            {/* Desktop: row of 5 (unchanged) */}
            <div className="hidden md:flex flex-nowrap gap-4">
              {items.map((item) => (
                <SquareButton
                  key={item.role}
                  role={item.role}
                  href={item.href}
                  src={item.src}
                  size={120}
                  eager
                />
              ))}
            </div>

            {/* Mobile: 2 rows total with uniform spacing */}
            <div className="md:hidden mt-2 grid grid-cols-6 gap-4 justify-items-center">
              {items.slice(0, 3).map((item) => (
                <div key={item.role} className="col-span-2">
                  <SquareButton role={item.role} href={item.href} src={item.src} size={84} eager />
                </div>
              ))}
              <div className="col-start-2 col-span-2">
                <SquareButton role={items[3].role} href={items[3].href} src={items[3].src} size={84} eager />
              </div>
              <div className="col-start-4 col-span-2">
                <SquareButton role={items[4].role} href={items[4].href} src={items[4].src} size={84} eager />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
