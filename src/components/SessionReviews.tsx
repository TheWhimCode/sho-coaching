"use client";
import { useRef, useEffect } from "react";
import { motion, useAnimation } from "framer-motion";
import Image from "next/image";

type Review = { reviewer: string; text: string; rankImg: string; champImg: string };

export default function SessionReviews({ reviews }: { reviews: Review[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const groupRef = useRef<HTMLDivElement>(null); // measure first row width
  const controls = useAnimation();

  useEffect(() => {
    controls.start({ opacity: 1, y: 0 });
  }, [controls]);

  useEffect(() => {
    const el = containerRef.current;
    const g = groupRef.current;
    if (!el || !g) return;

    let frame = 0;
    let last = performance.now();
    let isDragging = false;
    let startX = 0;
    let startScroll = 0;
    let running = true;
    let hasInteracted = false; // set to true while user drags
    let restartTimer: ReturnType<typeof setTimeout> | null = null;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const speed = 30; // px/s

    const groupWidth = () => g.offsetWidth;

    const tick = (now: number) => {
      if (!running || hasInteracted) return;
      const dt = (now - last) / 1000;
      last = now;

      if (!isDragging && !prefersReduced) {
        el.scrollLeft += speed * dt;
        const w = groupWidth();
        if (el.scrollLeft >= w) el.scrollLeft -= w;       // wrap forward
        else if (el.scrollLeft < 0) el.scrollLeft += w;   // wrap backward
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    // drag to pause
    const onDown = (e: PointerEvent) => {
      isDragging = true;
      hasInteracted = true;
      startX = e.clientX;
      startScroll = el.scrollLeft;
      el.setPointerCapture?.(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      if (!isDragging) return;
      el.scrollLeft = startScroll - (e.clientX - startX);
      const w = groupWidth();
      if (el.scrollLeft >= w) el.scrollLeft -= w;
      else if (el.scrollLeft < 0) el.scrollLeft += w;
    };
    const onUp = (e: PointerEvent) => {
      isDragging = false;
      try { el.releasePointerCapture?.(e.pointerId); } catch {}
    };

    // hover pause; resume 1s after mouse leaves
    const onEnter = () => {
      running = false;
      if (restartTimer) { clearTimeout(restartTimer); restartTimer = null; }
    };
    const onLeave = () => {
      if (restartTimer) clearTimeout(restartTimer);
      restartTimer = setTimeout(() => {
        running = true;
        hasInteracted = false; // allow auto-scroll again
        last = performance.now();
        frame = requestAnimationFrame(tick);
      }, 1000); // 1s pause
    };

    const onResize = () => {
      const w = groupWidth();
      if (el.scrollLeft >= w) el.scrollLeft -= w;
    };

    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
    el.addEventListener("mouseenter", onEnter);
    el.addEventListener("mouseleave", onLeave);
    window.addEventListener("resize", onResize);

    return () => {
      if (restartTimer) clearTimeout(restartTimer);
      cancelAnimationFrame(frame);
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
      el.removeEventListener("mouseenter", onEnter);
      el.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("resize", onResize);
    };
  }, [reviews, controls]);

  // Row: optionally attach ref for measuring
  const Row = ({ withRef = false }: { withRef?: boolean }) => (
    <div ref={withRef ? groupRef : null} className="inline-flex gap-4 px-2">
      {reviews.map((t, i) => (
        <div
          key={i}
          className="w-80 shrink-0 bg-white/5 ring-1 ring-white/10 rounded-xl p-4 text-white/85 text-sm"
        >
          {/* header: left text, right icons */}
          <div className="mb-2 flex items-start justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-semibold truncate">{t.reviewer}</span>
              <span className="text-yellow-400 text-base">★★★★★</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Image src={t.rankImg} alt="Rank" width={20} height={20} className="rounded" />
              <Image src={t.champImg} alt="Champion" width={20} height={20} className="rounded" />
            </div>
          </div>

          <div>“{t.text}”</div>
        </div>
      ))}
    </div>
  );

  return (
    <motion.div
      ref={containerRef}
      className="relative overflow-x-hidden py-4 mask-x-fade max-w-2xl mx-auto"
      initial={{ opacity: 0, y: 24 }}
      animate={controls}
      transition={{ duration: 0.7, ease: "easeOut" }}
      style={{ userSelect: "none", cursor: "grab" }}
    >
      <div className="inline-flex">
        <Row withRef /> {/* first copy (measured) */}
        <Row />         {/* second copy */}
      </div>
    </motion.div>
  );
}
