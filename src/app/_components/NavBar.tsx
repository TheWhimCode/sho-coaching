// src/app/_components/NavBar.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image"; // 👈 for logo
import { Menu, X, Youtube } from "lucide-react";
import { FaDiscord, FaTiktok } from "react-icons/fa";

const NAV = [
  { label: "Home", href: "/" },
  { label: "Coaching", href: "/coaching" },
  { label: "Patreon", href: "https://patreon.com", external: true },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export default function NavBar({ className = "" }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    const maxScroll = 100; // fully faded after 100px scroll
    const onScroll = () => {
      const y = window.scrollY;
      const o = Math.max(0, Math.min(1, 1 - y / maxScroll));
      setOpacity(o);
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`sticky top-0 z-40 w-full ${className}`}>
      {/* Logo icon (always visible, positioned above fading bar) */}
<Link
  href="/"
  className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2 z-20 flex items-center"
>
  <Image
    src="/images/Logo_orange.png"
    alt="Sho Coaching Logo"
    width={38}   // ⬅️ increased size
    height={38}  // ⬅️ increased size
    className="rounded-md"
  />
</Link>


      {/* Fading nav bar spans full width */}
      <div
        className="transition-[opacity] duration-75"
        style={{ opacity }}
      >
        {/* Backdrop + underline */}
        <div className="absolute inset-0 -z-10 bg-[#0B0F1A]/70 backdrop-blur-md border-b border-white/10" />

        <nav className="w-full">
          <div className="h-16 md:h-20 flex items-center justify-between pl-12 md:pl-18 pr-4 md:pr-6">
            {/* Logo title */}
            <span className="text-lg md:text-xl font-semibold tracking-tight">
              Sho Coaching
            </span>

            {/* CENTER nav links */}
            <div className="hidden md:flex items-center gap-8">
              {NAV.map((it) =>
                it.external ? (
                  <a
                    key={it.href}
                    href={it.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-base md:text-lg text-white/80 hover:text-white transition"
                  >
                    {it.label}
                  </a>
                ) : (
                  <Link
                    key={it.href}
                    href={it.href}
                    className="text-base md:text-lg text-white/80 hover:text-white transition"
                  >
                    {it.label}
                  </Link>
                )
              )}
            </div>

            {/* RIGHT: socials */}
            <div className="hidden md:flex items-center gap-3">
              <Link
                href="https://youtube.com"
                target="_blank"
                aria-label="YouTube"
                className="p-1.5 rounded hover:bg-white/10"
              >
                <Youtube className="h-5 w-5" />
              </Link>
              <Link
                href="https://tiktok.com"
                target="_blank"
                aria-label="TikTok"
                className="p-1.5 rounded hover:bg-white/10"
              >
                <FaTiktok className="h-5 w-5" />
              </Link>
              <Link
                href="https://discord.gg"
                target="_blank"
                aria-label="Discord"
                className="p-1.5 rounded hover:bg-white/10"
              >
                <FaDiscord className="h-5 w-5" />
              </Link>
            </div>

            {/* Mobile hamburger */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-white/10"
              onClick={() => setOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </nav>

        {/* Mobile dropdown */}
        {open && (
          <div className="md:hidden border-t border-white/10 bg-[#0B0F1A]/90 backdrop-blur-md">
            <div className="px-4 py-3">
              <div className="flex flex-col">
                {NAV.map((it) =>
                  it.external ? (
                    <a
                      key={it.href}
                      href={it.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2 text-base text-white/85"
                      onClick={() => setOpen(false)}
                    >
                      {it.label}
                    </a>
                  ) : (
                    <Link
                      key={it.href}
                      href={it.href}
                      className="py-2 text-base text-white/85"
                      onClick={() => setOpen(false)}
                    >
                      {it.label}
                    </Link>
                  )
                )}

                <div className="mt-3 flex items-center gap-3">
                  <Link
                    href="https://youtube.com"
                    target="_blank"
                    className="p-1.5 rounded hover:bg-white/10"
                  >
                    <Youtube className="h-5 w-5" />
                  </Link>
                  <Link
                    href="https://tiktok.com"
                    target="_blank"
                    className="p-1.5 rounded hover:bg-white/10"
                  >
                    <FaTiktok className="h-5 w-5" />
                  </Link>
                  <Link
                    href="https://discord.gg"
                    target="_blank"
                    className="p-1.5 rounded hover:bg-white/10"
                  >
                    <FaDiscord className="h-5 w-5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
