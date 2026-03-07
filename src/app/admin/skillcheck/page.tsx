// src/app/admin/skillcheck/page.tsx
"use client";

import Link from "next/link";
import React from "react";

export default function AdminSkillcheckPage() {
  return (
    <div className="pb-20">
        <div className="mx-auto w-full max-w-5xl px-6 space-y-8">
          <div className="h-1" />
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-xl font-semibold">⚡ Skillcheck</h1>
          </div>

          {/* Draft section */}
          <section className="space-y-4">
            <h2 className="text-xs uppercase text-white/80 font-medium">
              Draft
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Link
                href="/admin/skillcheck/create"
                className="group flex items-center gap-4 overflow-hidden rounded-2xl ring-1 ring-white/10 bg-zinc-900/70 p-4 transition hover:ring-white/25 hover:bg-zinc-800/80"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/10 text-xl font-bold text-white ring-1 ring-white/20 group-hover:bg-white/15">
                  +
                </span>
                <div className="min-w-0">
                  <div className="font-semibold text-white">
                    Create a new draft
                  </div>
                  <div className="text-sm text-white/60">
                    Author new skillcheck questions
                  </div>
                </div>
              </Link>
              <Link
                href="/admin/skillcheck/drafts"
                className="group flex items-center gap-4 overflow-hidden rounded-2xl ring-1 ring-white/10 bg-zinc-900/70 p-4 transition hover:ring-white/25 hover:bg-zinc-800/80"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/10 text-lg ring-1 ring-white/20 group-hover:bg-white/15">
                  📋
                </span>
                <div className="min-w-0">
                  <div className="font-semibold text-white">
                    Review drafts
                  </div>
                  <div className="text-sm text-white/60">
                    Approve or edit pending drafts
                  </div>
                </div>
              </Link>
            </div>
          </section>
        </div>
    </div>
  );
}
