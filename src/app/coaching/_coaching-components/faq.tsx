"use client";

import React from "react";
import { ChevronDown } from "lucide-react";
import type { FaqItem } from "@/lib/coaching/FAQ.data";
import { FAQ as DEFAULT_FAQ } from "@/lib/coaching/FAQ.data";

type Props = {
  items?: FaqItem[];
  className?: string;
  containerClassName?: string; // e.g. "max-w-6xl px-6"
};

export default function FAQ({
  items = DEFAULT_FAQ,
  className = "",
  containerClassName = "max-w-6xl px-6",
}: Props) {
  const [openIndex, setOpenIndex] = React.useState<number | null>(0);

  return (
    <section
      className={["relative isolate py-12 md:py-18", className].filter(Boolean).join(" ")}
      style={{
        // full-bleed like Reviews
        marginLeft: "calc(50% - 50vw)",
        marginRight: "calc(50% - 50vw)",
        width: "100vw",
      }}
    >
      {/* Top/Bottom gradient lines */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 z-10 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
      />
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 z-10 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
      />

      {/* Texture overlay */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          backgroundImage: "url('/images/coaching/texture3.jpg')",
          backgroundRepeat: "repeat",
          backgroundSize: "auto",
          mixBlendMode: "overlay",
          opacity: 0.3,
          filter: "contrast(1.2) brightness(1.05)",
          maskImage:
            "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
          WebkitMaskImage:
            "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
        }}
      />

      {/* Strong inner shadow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          boxShadow: `
            inset 0 30px 12px -6px rgba(0,0,0,0.5),
            inset 0 -30px 12px -6px rgba(0,0,0,0.5),
            inset 30px 0 24px -6px rgba(0,0,0,0.8),
            inset -30px 0 24px -6px rgba(0,0,0,0.8)
          `,
        }}
      />

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-7xl">
        <div className={containerClassName}>
          <div className="mt-0 grid gap-3">
            {items.map((item, i) => {
              const open = i === openIndex;
              return (
                <div
                  key={i}
                  className={`rounded-xl overflow-hidden bg-white/[.05] border border-white/10 ring-1 ring-inset ${
                    open ? "ring-cyan-300/25" : "ring-cyan-300/10"
                  } shadow-[8px_8px_20px_-6px_rgba(0,0,0,.6)]`}
                >
                  <button
                    className="w-full flex items-center justify-between gap-4 px-4 md:px-5 py-3 md:py-4 text-left select-none hover:bg-white/[.06] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                    aria-expanded={open}
                    onClick={() => setOpenIndex(open ? null : i)}
                  >
                    <span className="text-base md:text-lg font-semibold text-white">
                      {item.q}
                    </span>
                    <ChevronDown
                      className={`h-5 w-5 shrink-0 transition-transform duration-200 ${
                        open ? "rotate-180" : ""
                      }`}
                      aria-hidden
                    />
                  </button>

                  <div
                    className={`grid transition-[grid-template-rows,opacity] duration-250 ease-out ${
                      open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                    }`}
                  >
                    <div className="min-h-0">
                      <div className="px-4 md:px-5 pb-4 md:pb-5 text-sm md:text-base text-white/80 leading-relaxed">
                        {typeof item.a === "string" ? (
                          <p>{item.a}</p>
                        ) : (
                          <ul className="list-disc pl-5 space-y-1">
                            {item.a.map((line, j) => (
                              <li key={j}>{line}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
