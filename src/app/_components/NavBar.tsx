// src/app/_components/NavBar.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import { FaDiscord, FaTiktok, FaYoutube } from "react-icons/fa";

const NAV = [
  { label: "Coaching", href: "/coaching/vod" },
  { label: "Patreon", href: "https://www.patreon.com/c/Shoaching", external: true },
];

const COURSE_LINKS = [
  { label: "Top", href: "/courses/top" },
  { label: "Jungle", href: "/courses/jungle" },
  { label: "Mid", href: "/courses/mid" },
  { label: "Top", href: "/courses/top" }, // kept duplicate as you had it
  { label: "Support", href: "/courses/support" },
];

export default function NavBar({ className = "" }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    const maxScroll = 100;
    const onScroll = () => {
      const y = window.scrollY;
      setOpacity(Math.max(0, Math.min(1, 1 - y / maxScroll)));
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`fixed top-0 left-0 right-0 z-40 ${className}`}>
      {/* LOGO */}
      <Link
        href="/"
        className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2 z-20 flex items-center"
      >
        <Image
          src="/images/Logo_blue.png"
          alt="Sho Coaching Logo"
          width={38}
          height={38}
          priority
          sizes="38px"
          className="rounded-md"
        />
      </Link>

      {/* Fading bar */}
      <div className="transition-[opacity] duration-75" style={{ opacity }}>
        <div className="absolute inset-0 -z-10 bg-[#0B0F1A]/30 backdrop-blur-md border-b border-white/10" />

        <nav className="w-full">
          <div className="relative h-16 md:h-20 flex items-center pl-14 md:pl-20 pr-4 md:pr-6">
            {/* LEFT: title */}
            <span className="text-lg md:text-xl font-semibold tracking-tight">
              Sho Coaching
            </span>

            {/* CENTER: links */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="hidden md:flex items-center gap-8 pointer-events-auto">
                {NAV.map((it) =>
                  it.external ? (
                    <a
                      key={it.href}
                      href={it.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-base md:text-lg text-white/80 hover:text-orange-400 transition"
                    >
                      {it.label}
                    </a>
                  ) : (
                    <Link
                      key={it.href}
                      href={it.href}
                      className="text-base md:text-lg text-white/80 hover:text-orange-400 transition"
                    >
                      {it.label}
                    </Link>
                  )
                )}

                {/* COURSES (disabled for now) */}
                <button
                  type="button"
                  disabled
                  aria-disabled="true"
                  title="Courses coming soon"
                  className="text-base md:text-lg text-white/50 cursor-not-allowed select-none"
                >
                  Courses
                </button>

                {/* CONTACT (last) */}
                <Link
                  href="/contact"
                  className="text-base md:text-lg text-white/80 hover:text-orange-400 transition"
                >
                  Contact
                </Link>
              </div>
            </div>

            {/* RIGHT: socials + hamburger */}
            <div className="ml-auto flex items-center">
              <div className="hidden md:flex items-center gap-3">
                <Link
                  href="https://discord.gg/HfvxZBp"
                  target="_blank"
                  aria-label="Discord"
                  className="p-1.5 rounded hover:bg-white/10 text-white/80 hover:text-orange-400"
                >
                  <FaDiscord className="h-5 w-5" />
                </Link>
                <Link
                  href="https://www.youtube.com/@ShoCoaching"
                  target="_blank"
                  aria-label="YouTube"
                  className="p-1.5 rounded hover:bg-white/10 text-white/80 hover:text-orange-400"
                >
                  <FaYoutube className="h-5 w-5" />
                </Link>
                <Link
                  href="https://tiktok.com"
                  target="_blank"
                  aria-label="TikTok"
                  className="p-1.5 rounded hover:bg-white/10 text-white/80 hover:text-orange-400"
                >
                  <FaTiktok className="h-5 w-5" />
                </Link>
              </div>

              {/* Mobile hamburger */}
              <button
                className="md:hidden ml-2 p-2 rounded-lg hover:bg-white/10"
                onClick={() => setOpen((v) => !v)}
                aria-label="Toggle menu"
              >
                {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
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
                      className="py-2 text-base text-white/80 hover:text-orange-400"
                      onClick={() => setOpen(false)}
                    >
                      {it.label}
                    </a>
                  ) : (
                    <Link
                      key={it.href}
                      href={it.href}
                      className="py-2 text-base text-white/80 hover:text-orange-400"
                      onClick={() => setOpen(false)}
                    >
                      {it.label}
                    </Link>
                  )
                )}

                {/* COURSES (disabled) */}
                <div className="py-2 text-base text-white/50 flex items-center justify-between">
                  <span>Courses</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-white/10">Soon</span>
                </div>

                {/* CONTACT */}
                <Link
                  href="/contact"
                  className="py-2 text-base text-white/80 hover:text-orange-400"
                  onClick={() => setOpen(false)}
                >
                  Contact
                </Link>

                {/* socials */}
                <div className="mt-3 flex items-center gap-3">
                  <Link
                    href="https://www.youtube.com/@ShoCoaching"
                    target="_blank"
                    className="p-1.5 rounded hover:bg-white/10 text-white/80 hover:text-orange-400"
                  >
                    <FaYoutube className="h-5 w-5" />
                  </Link>
                  <Link
                    href="https://tiktok.com"
                    target="_blank"
                    className="p-1.5 rounded hover:bg-white/10 text-white/80 hover:text-orange-400"
                  >
                    <FaTiktok className="h-5 w-5" />
                  </Link>
                  <Link
                    href="https://discord.gg/HfvxZBp"
                    target="_blank"
                    className="p-1.5 rounded hover:bg-white/10 text-white/80 hover:text-orange-400"
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
