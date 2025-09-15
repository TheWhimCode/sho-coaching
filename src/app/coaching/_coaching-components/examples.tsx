"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";

type ExampleItem = {
  role: "Top" | "Jungle" | "Mid" | "ADC" | "Support";
  href: string;
  bg: string;
  icon: string;
};

const items: ExampleItem[] = [
  { role: "Top",     href: "https://www.patreon.com/yourpatreon/posts?filters[tag]=Top%20Free",     bg: "/examples/top.jpg",     icon: "/roles/top.svg" },
  { role: "Jungle",  href: "https://www.patreon.com/yourpatreon/posts?filters[tag]=Jungle%20Free",  bg: "/examples/jungle.jpg",  icon: "/roles/jungle.svg" },
  { role: "Mid",     href: "https://www.patreon.com/yourpatreon/posts?filters[tag]=Mid%20Free",     bg: "/examples/mid.jpg",     icon: "/roles/mid.svg" },
  { role: "ADC",     href: "https://www.patreon.com/yourpatreon/posts?filters[tag]=ADC%20Free",     bg: "/examples/adc.jpg",     icon: "/roles/adc.svg" },
  { role: "Support", href: "https://www.patreon.com/yourpatreon/posts?filters[tag]=Support%20Free", bg: "/examples/support.jpg", icon: "/roles/support.svg" },
];

export default function CoachingExamples() {
  return (
    <section className="relative">
      {/* Keep width, align left edge to PresetCards content */}
      <div
        className="
          max-w-7xl
          pl-6
          lg:pl-[calc((min(100vw,80rem)-72rem)/2+1.5rem)]
          pr-4 md:pr-6
        "
      >
        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_auto] items-center gap-8 md:gap-10">
          {/* Left: text */}
          <div className="min-w-0">
            <h2 className="text-2xl md:text-3xl font-semibold">
              Need an example?
            </h2>
            <p className="mt-2 text-white/70 text-sm md:text-base">
              Watch some of Shos coaching sessions for free on Patreon.
            </p>
            <p className="mt-2 text-xs text-white/50">
              Top, Jungle, Mid, ADC, Support.
            </p>
          </div>

          {/* Right: 5 square buttons */}
          <div className="min-w-0">
            <div className="flex flex-nowrap gap-3 overflow-x-auto md:overflow-visible">
              {items.map((item) => (
                <Link
                  key={item.role}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative shrink-0 w-24 h-24 sm:w-28 sm:h-28 lg:w-28 lg:h-28 rounded-xl overflow-hidden border border-white/10"
                >
                  <div
                    className="absolute inset-0 bg-center bg-cover transition-transform duration-300 group-hover:scale-105"
                    style={{ backgroundImage: `url(${item.bg})` }}
                    aria-hidden
                  />
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/25 transition" aria-hidden />
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                    <img
                      src={item.icon}
                      alt={item.role}
                      className="w-7 h-7 opacity-80 group-hover:opacity-100 transition"
                    />
                    <span className="text-[11px] font-medium">{item.role}</span>
                  </div>
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    whileHover={{ opacity: 1, y: 0 }}
                    className="absolute bottom-2 left-2 right-2 text-center text-[10px] text-white/80"
                  >
                    Watch on Patreon
                  </motion.div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
