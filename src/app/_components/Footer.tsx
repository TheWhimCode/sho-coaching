// src/app/_components/Footer.tsx
"use client";

import Link from "next/link";
import { FaDiscord, FaYoutube, FaTiktok, FaEnvelope } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";

export default function Footer() {
  return (
    <footer className="relative mt-32 text-white/70">
      <div className="mx-auto max-w-7xl px-6 py-12 md:py-16">

        {/* Legal links (now ABOVE divider) */}
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

        {/* Divider (reduced spacing) */}
        <div className="my-6 h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        {/* Email WITH icon (reduced spacing below divider) */}
        <div className="flex items-center justify-center mt-1">
          <a
            href="mailto:im.sho@yahoo.com"
            aria-label="Email"
            className="p-2 rounded hover:bg-white/10 text-white/80 hover:text-orange-400 transition flex items-center gap-2 text-sm md:text-base"
          >
            <FaEnvelope className="h-5 w-5" />
            im.sho@yahoo.com
          </a>
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

          <a
            href="https://x.com/Shoaching"
            target="_blank"
            aria-label="X"
            className="p-2 rounded hover:bg-white/10 text-white/80 hover:text-orange-400 transition"
          >
            <FaXTwitter className="h-5 w-5" />
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
