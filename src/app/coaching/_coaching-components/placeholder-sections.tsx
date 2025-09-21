"use client";

import React from "react";

type SectionProps = { title: string; tagline?: string };

function BigSection({ title, tagline }: SectionProps) {
  return (
    <section className="relative flex flex-col items-center justify-center text-center py-[72vh] md:py-[90vh]">
      <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
        {title}
      </h2>
      {tagline && (
        <p className="text-xl md:text-2xl text-white/80 mb-12 max-w-2xl">
          {tagline}
        </p>
      )}
      <div className="w-full max-w-3xl h-64 md:h-96 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center text-lg text-white/60">
        Large Element Placeholder
      </div>
    </section>
  );
}

export default function PlaceholderSections() {
  return (
    <>
      <BigSection
        title="Section One"
        tagline="This is a bold tagline for the first section."
      />
      <BigSection
        title="Section Two"
        tagline="Another tagline to describe your idea."
      />
      <BigSection
        title="Section Three"
        tagline="A final tagline to inspire action."
      />
    </>
  );
}
