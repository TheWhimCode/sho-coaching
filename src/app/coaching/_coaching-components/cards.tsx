"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import { Scroll, Lightning, PuzzlePiece, Signature } from "@phosphor-icons/react";
import type { Preset } from "@/lib/sessions/preset";
import { colorsByPreset } from "@/lib/sessions/colors";
import TransitionOverlay from "@/app/coaching/_coaching-components/components/OverlayTransition";

type PresetSlug = "vod" | "signature" | "instant";

type Item = {
  slug: PresetSlug;
  title: string;
  subtitle: string;
  duration: string;
  badge?: string;
  image: string;
  price: number;
};

const DEFAULT_ITEMS: Item[] = [
  { slug: "vod", title: "VOD Review", subtitle: "The classic. Get a full in-depth breakdown of your gameplay with insights on each stage of the game.", duration: "60 min", badge: "Most informative", image: "/images/sessions/VOD7.png", price: 40 },
  { slug: "signature", title: "Signature Session", subtitle: "Sho’s recommendation. Focused, structured and designed to make you climb.", duration: "45 min + Follow-up", badge: "Best overall", image: "/images/sessions/Signature3.png", price: 45 },
  { slug: "instant", title: "Instant Insight", subtitle: "Get quick, actionable answers to your most pressing questions.", duration: "30 min", badge: "Fastest feedback", image: "/images/sessions/Instant4.png", price: 20 },
];

function SessionIcon({ preset }: { preset: Preset }) {
  const { ring, glow } = colorsByPreset[preset] ?? colorsByPreset.custom;
  const size = 26;
  const glowStyle = { filter: `drop-shadow(0 0 8px ${glow})` } as React.CSSProperties;
  if (preset === "vod") return <Scroll size={size} weight="fill" color={ring} style={glowStyle} aria-hidden />;
  if (preset === "instant") return <Lightning size={size} weight="fill" color={ring} style={glowStyle} aria-hidden />;
  if (preset === "signature") return <Signature size={size} weight="bold" color={ring} style={glowStyle} aria-hidden />;
  return <PuzzlePiece size={size} weight="fill" color={ring} style={glowStyle} aria-hidden />;
}

function GlowRing({ preset, className = "" }: { preset: Preset; className?: string }) {
  const c = colorsByPreset[preset] ?? colorsByPreset.custom;
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 ${className}`}
      style={{ boxShadow: `0 0 0 1px rgba(255,255,255,.08) inset, 0 6px 24px -10px ${c.glow}` }}
    />
  );
}

function Card({ item, onFollowupInfo }: { item: Item; onFollowupInfo?: () => void }) {
  const router = useRouter();
  const pathname = usePathname();

  const [overlayActive, setOverlayActive] = useState(false);
  const [navQueuedTo, setNavQueuedTo] = useState<string | null>(null);
  const cancelledRef = useRef(false);

  const c = colorsByPreset[item.slug as Preset] ?? colorsByPreset.custom;
  const cssVars = { ["--ring" as const]: c.ring, ["--glow" as const]: c.glow } as React.CSSProperties;

  // Reset overlay state on any route change (incl. back/forward)
  useEffect(() => {
    cancelledRef.current = false;
    setOverlayActive(false);
    setNavQueuedTo(null);
  }, [pathname]);

  // Cancel if user hits Back during overlay animation
  useEffect(() => {
    const onPop = () => {
      cancelledRef.current = true;
      setOverlayActive(false);
      setNavQueuedTo(null);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const navigateAfterOverlay = useCallback(() => {
    if (cancelledRef.current) return;      // user backed out — do nothing
    if (!navQueuedTo) return;
    router.push(navQueuedTo);
  }, [router, navQueuedTo]);

  const handleNavigate = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (overlayActive) return;
    (e.currentTarget as HTMLElement)?.blur?.();

    setNavQueuedTo(`/coaching/${item.slug}`);
    setOverlayActive(true);                // overlay runs; onComplete → navigateAfterOverlay
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") handleNavigate(e);
  };

  const handleFollowupActivate = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation(); // don't start overlay/nav
    (e.currentTarget as HTMLElement)?.blur?.();
    onFollowupInfo?.();
  };

  return (
    <>
      <div
        className="relative group"
        role="link"
        tabIndex={0}
        onClick={handleNavigate}
        onKeyDown={handleKeyDown}
      >
        <article
          style={cssVars}
          className="flex flex-col h-full overflow-hidden rounded-3xl border border-white/10 bg-white/[.03] backdrop-blur-md transition-all duration-300 cursor-pointer hover:-translate-y-1 hover:border-[var(--ring)] hover:shadow-[0_0_10px_1px_var(--glow)] focus-visible:outline-none focus-visible:border-[var(--ring)] focus-visible:shadow-[0_0_10px_1px_var(--glow)]"
        >
          {/* Media */}
          <div className="relative w-full aspect-square overflow-hidden rounded-t-3xl">
            <Image
              src={item.image}
              alt={item.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              priority={false}
            />
          </div>

          {/* Content */}
          <div className="relative z-10 flex flex-col flex-1 p-7 rounded-b-3xl bg-[#0B0F1A]">
            <GlowRing preset={item.slug as Preset} className="rounded-b-3xl" />

            <div className="flex items-start justify-between gap-3 mb-3">
              <h3 className="text-2xl font-semibold tracking-tight text-white">{item.title}</h3>
              <SessionIcon preset={item.slug as Preset} />
            </div>

            <div className="mb-4 h-px w-full bg-gradient-to-r from-transparent via-white/8 to-transparent" />

            <p className="text-white/70 mb-6 leading-relaxed">{item.subtitle}</p>

            <div className="flex items-center gap-4 text-base text-white mt-auto">
              {item.slug === "signature" ? (
                <span className="font-semibold flex items-center gap-1">
                  45 min +
                  <span
                    role="button"
                    tabIndex={0}
                    aria-label="Learn about the Follow-up below"
                    onClick={onFollowupInfo ? (e) => { e.preventDefault(); e.stopPropagation(); onFollowupInfo(); } : undefined}
                    className="ml-1 px-2 py-0.5 rounded-full bg-white/10 text-white/90 cursor-pointer transition-colors hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 inline-flex items-center gap-1"
                  >
                    Follow-up
                    <span className="flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold text-white/70" aria-hidden>?</span>
                  </span>
                </span>
              ) : (
                <span className="font-semibold">{item.duration}</span>
              )}

              <span className="ml-auto font-semibold">€{item.price}</span>
            </div>
          </div>
        </article>
      </div>

      {/* One overlay instance; 60px radius + particles handled inside TransitionOverlay */}
      <TransitionOverlay active={overlayActive} duration={0.7} onComplete={navigateAfterOverlay} />
    </>
  );
}

export default function PresetCards({
  items = DEFAULT_ITEMS,
  className = "",
  containerClassName = "max-w-6xl px-6",
  onFollowupInfo,
}: {
  items?: Item[];
  className?: string;
  containerClassName?: string;
  onFollowupInfo?: () => void;
}) {
  return (
    <section className={`w-full ${className}`}>
      <div className={`mx-auto w-full ${containerClassName}`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {items.map((item) => (
            <Card key={item.slug} item={item} onFollowupInfo={onFollowupInfo} />
          ))}
        </div>
      </div>
    </section>
  );
}
