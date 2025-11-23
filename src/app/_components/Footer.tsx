// src/app/_components/Footer.tsx
"use client";

import Link from "next/link";
import { FaDiscord, FaYoutube, FaTiktok } from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="relative mt-32 text-white/70">
      {/* background panel */}
      <div className="absolute inset-0 -z-10 bg-[#0B0F1A]/40 backdrop-blur-md border-t border-white/10" />

      <div className="mx-auto max-w-7xl px-6 py-12 md:py-16">
        {/* Top row: nav links */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-6 text-base md:text-lg">
          <Link href="/coaching" className="hover:text-orange-400 transition">
            Coaching
          </Link>
          <a
            href="https://www.patreon.com/c/Shoaching"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-orange-400 transition"
          >
            Patreon
          </a>
          <Link href="/contact" className="hover:text-orange-400 transition">
            Contact
          </Link>
        </div>

        {/* Divider */}
        <div className="my-10 h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        {/* Legal + required links */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-6 text-sm md:text-base text-white/60">
          <Link href="/terms" className="hover:text-orange-400 transition">
            Terms of Service
          </Link>
          <Link href="/privacy" className="hover:text-orange-400 transition">
            Privacy Policy
          </Link>
          <Link href="/imprint" className="hover:text-orange-400 transition">
            Imprint
          </Link>
        </div>

        {/* Socials */}
        <div className="mt-10 flex items-center justify-center gap-4">
          <a
            href="https://discord.gg/HfvxZBp"
            target="_blank"
            aria-label="Discord"
            className="p-2 rounded hover:bg-white/10 text-white/80 hover:text-orange-400 transition"
          >
            <FaDiscord className="h-5 w-5" />
          </a>

          <a
            href="https://www.youtube.com/@ShoCoaching"
            target="_blank"
            aria-label="YouTube"
            className="p-2 rounded hover:bg-white/10 text-white/80 hover:text-orange-400 transition"
          >
            <FaYoutube className="h-5 w-5" />
          </a>

          <a
            href="https://tiktok.com"
            target="_blank"
            aria-label="TikTok"
            className="p-2 rounded hover:bg-white/10 text-white/80 hover:text-orange-400 transition"
          >
            <FaTiktok className="h-5 w-5" />
          </a>
        </div>

        {/* Copyright */}
        <p className="mt-10 text-center text-xs md:text-sm text-white/40 tracking-wide">
          © {new Date().getFullYear()} Sho Coaching — All rights reserved.
        </p>
      </div>
    </footer>
  );
}
