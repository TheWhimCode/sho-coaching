// app/contact/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";

export default function ContactPage() {
  const [status, setStatus] = useState<"idle" | "sending" | "ok" | "err">("idle");
  const [form, setForm] = useState({
    email: "",
    message: "",
    honey: "",
    consent: false,
  });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.honey) return; // bot trap
    setStatus("sending");
    try {
      const r = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!r.ok) throw new Error();
      setStatus("ok");
      setForm({ email: "", message: "", honey: "", consent: false });
    } catch {
      setStatus("err");
    }
  }

  return (
    <main className="min-h-screen pt-36 pb-24">
      <div className="mx-auto max-w-5xl px-4">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          {/* LEFT: Discord info */}
          <div>
            <h2 className="text-3xl md:text-4xl font-bold">
              Join the{" "}
              <span className="text-[#7289DA]">Discord</span>
            </h2>
            <p className="mt-4 text-white/70 text-lg">
              The fastest way to reach me to ask questions.
            </p>
            <Link
              href="https://discord.gg/HfvxZBp"
              target="_blank"
              className="mt-6 inline-flex items-center justify-center rounded-xl px-6 py-4 font-medium text-lg bg-[#5865F2] hover:bg-[#4752C4] text-white transition w-full max-w-sm"
            >
              Join Discord
            </Link>
            <p className="mt-3 text-xs text-white/50">I typically reply same day</p>
          </div>

          {/* RIGHT: Contact form */}
          <div className="rounded-2xl border border-white/10 bg-[#0B1222]/90 p-10 backdrop-blur-md min-h-[520px] flex flex-col justify-between">
            <h2 className="text-2xl font-semibold mb-8">Contact Form</h2>

            {status === "ok" && (
              <div className="mb-6 rounded-xl border border-green-500/30 bg-green-500/10 p-4 text-base">
                Message sent. I’ll get back to you soon.
              </div>
            )}
            {status === "err" && (
              <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-base">
                Something went wrong. Please try again.
              </div>
            )}

            <form onSubmit={onSubmit} className="space-y-6 text-base">
              {/* Honeypot */}
              <input
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={form.honey}
                onChange={(e) => setForm({ ...form, honey: e.target.value })}
                className="hidden"
              />

              <label className="flex flex-col gap-2">
                <span className="text-sm text-white/70">Email</span>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="you@example.com"
                  className="rounded-xl bg-white/5 border border-white/10 px-4 py-3 outline-none focus:border-amber-400/60 text-base"
                />
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-sm text-white/70">Message</span>
                <textarea
                  required
                  rows={7}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="How can I help?"
                  className="rounded-xl bg-white/5 border border-white/10 px-4 py-3 outline-none focus:border-amber-400/60 resize-y text-base"
                />
              </label>

              <label className="flex items-start gap-3 text-sm text-white/70">
                <input
                  type="checkbox"
                  checked={form.consent}
                  onChange={(e) => setForm({ ...form, consent: e.target.checked })}
                  required
                  className="mt-1 scale-110"
                />
                I agree to the processing of my data for this request.{" "}
                <Link href="/privacy" className="underline hover:text-amber-400 ml-1">
                  Privacy
                </Link>
                .
              </label>

              {/* Submit button */}
              <div className="relative">
                <span className="pointer-events-none absolute -inset-1 rounded-xl blur-md opacity-30 -z-10 bg-[radial-gradient(60%_100%_at_50%_50%,_rgba(255,179,71,.28),_transparent_70%)]" />
                <button
                  type="submit"
                  disabled={status === "sending"}
                  className="relative z-10 w-full rounded-xl px-6 py-3.5 text-lg font-semibold text-[#0A0A0A] bg-[#fc8803] hover:bg-[#f8a81a] transition shadow-[0_10px_24px_rgba(245,158,11,.35)] ring-1 ring-[rgba(255,190,80,.55)] disabled:opacity-60"
                >
                  {status === "sending" ? "Sending…" : "Send Message"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
