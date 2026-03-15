// app/contact/page.tsx
"use client";

import Link from "next/link";

export default function ContactPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="mx-auto max-w-5xl px-4 w-full flex justify-center -translate-y-8 md:-translate-y-10">
        <div className="max-w-xl w-full text-center space-y-3">
          <h2 className="text-3xl md:text-4xl font-bold">
            Join the{" "}
            <span className="text-[#7289DA]">Discord</span>
          </h2>
          <p className="text-white/70 text-lg">
            The fastest way to reach me to ask questions.
          </p>
          <Link
            href="https://discord.gg/HfvxZBp"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-xl px-6 py-4 font-medium text-lg bg-[#5865F2] hover:bg-[#4752C4] text-white transition w-full max-w-sm"
          >
            Join Discord
          </Link>
        </div>
      </div>
    </main>
  );
}
