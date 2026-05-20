"use client";

import { useEffect, useRef } from "react";
import {
  cursorPoolRgb,
  randomBlobRgb,
  rgba,
  type RGB,
} from "./accentParticleVariants";

type Blob = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  decay: number;
  radius: number;
  stretch: number;
  angle: number;
  phase: number;
  wobble: number;
  rgb: RGB;
};

type Props = {
  color: string;
  point: { x: number; y: number } | null;
  active: boolean;
};

const MAX_BLOBS = 28;
const SPAWN_PER_MOVE = 2;
const DRAG = 0.94;
const MIST_RISE = -0.06;

/** Liquid drop: sharp core + thin edge falloff (minimal blur). */
function drawLiquidBlob(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  rgb: RGB,
  alpha: number,
  stretch = 1,
  angle = 0
) {
  const a = Math.max(0, Math.min(1, alpha));
  if (a < 0.02 || radius < 0.5) return;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.scale(stretch, 1 / stretch);
  ctx.filter = "none";

  const edge = ctx.createRadialGradient(0, 0, radius * 0.38, 0, 0, radius);
  edge.addColorStop(0, rgba(rgb, a * 0.55));
  edge.addColorStop(0.55, rgba(rgb, a * 0.22));
  edge.addColorStop(1, rgba(rgb, 0));
  ctx.fillStyle = edge;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fill();

  const midR = radius * 0.42;
  const mid = ctx.createRadialGradient(0, 0, 0, 0, 0, midR);
  mid.addColorStop(0, rgba(rgb, Math.min(1, a * 1.05)));
  mid.addColorStop(0.62, rgba(rgb, a * 0.75));
  mid.addColorStop(1, rgba(rgb, 0));
  ctx.fillStyle = mid;
  ctx.beginPath();
  ctx.arc(0, 0, midR, 0, Math.PI * 2);
  ctx.fill();

  const coreR = radius * 0.2;
  ctx.fillStyle = rgba(rgb, Math.min(1, a * 1.1));
  ctx.beginPath();
  ctx.arc(0, 0, coreR, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

export default function ButtonParticleTrail({ color, point, active }: Props) {
  const colorRef = useRef(color);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const blobsRef = useRef<Blob[]>([]);
  const activeRef = useRef(active);
  const pointRef = useRef(point);
  const rafRef = useRef(0);
  const enabledRef = useRef(false);
  const timeRef = useRef(0);

  activeRef.current = active;
  colorRef.current = color;
  pointRef.current = point;

  useEffect(() => {
    if (!point || !active) return;
    if (!enabledRef.current) return;

    const accent = colorRef.current;
    const list = blobsRef.current;
    const px = point.x;
    const py = point.y;

    for (let i = 0; i < SPAWN_PER_MOVE; i++) {
      if (list.length >= MAX_BLOBS) list.shift();

      const angle = Math.random() * Math.PI * 2;
      const dist = 4 + Math.random() * 14;
      const speed = 0.15 + Math.random() * 0.45;
      const isWisp = Math.random() < 0.35;

      list.push({
        x: px + Math.cos(angle) * dist * 0.4,
        y: py + Math.sin(angle) * dist * 0.4,
        vx: Math.cos(angle) * speed + (Math.random() - 0.5) * 0.2,
        vy: Math.sin(angle) * speed + MIST_RISE,
        life: 1,
        decay: 0.009 + Math.random() * 0.011,
        radius: isWisp ? 5 + Math.random() * 4 : 6 + Math.random() * 5,
        stretch: isWisp ? 1.08 + Math.random() * 0.12 : 1,
        angle: angle + (Math.random() - 0.5) * 0.6,
        phase: Math.random() * Math.PI * 2,
        wobble: 0.08 + Math.random() * 0.12,
        rgb: randomBlobRgb(accent),
      });
    }
  }, [point, active, color]);

  useEffect(() => {
    if (!active) {
      blobsRef.current = [];
    }
  }, [active]);

  useEffect(() => {
    const mqFine = window.matchMedia("(pointer: fine)");
    const mqWide = window.matchMedia("(min-width: 768px)");
    const mqMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    const syncEnabled = () => {
      enabledRef.current =
        mqFine.matches && mqWide.matches && !mqMotion.matches;
    };
    syncEnabled();

    mqFine.addEventListener("change", syncEnabled);
    mqWide.addEventListener("change", syncEnabled);
    mqMotion.addEventListener("change", syncEnabled);

    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    const resize = () => {
      const { width, height } = wrap.getBoundingClientRect();
      if (width < 1 || height < 1) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    const tick = (now: number) => {
      timeRef.current = now;
      const t = now * 0.001;
      const { width, height } = wrap.getBoundingClientRect();
      ctx.clearRect(0, 0, width, height);

      if (activeRef.current && pointRef.current && enabledRef.current) {
        const accent = colorRef.current;
        const pool = cursorPoolRgb(accent);
        const { x, y } = pointRef.current;
        const pulse = 0.88 + Math.sin(t * 3.2) * 0.12;
        const driftX = Math.sin(t * 1.4) * 3;
        const driftY = Math.cos(t * 1.1) * 2.5;

        drawLiquidBlob(ctx, x + driftX * 0.35, y + driftY * 0.35, 8 * pulse, pool, 0.62, 1, t * 0.3);
      }

      const list = blobsRef.current;
      for (let i = list.length - 1; i >= 0; i--) {
        const b = list[i];
        b.phase += b.wobble;
        b.x += b.vx;
        b.y += b.vy;
        b.vx *= DRAG;
        b.vy = b.vy * DRAG + MIST_RISE * 0.15;
        b.vx += Math.sin(b.phase * 0.7) * 0.04;
        b.life -= b.decay;

        if (b.life <= 0) {
          list.splice(i, 1);
          continue;
        }

        const breathe = 1 + Math.sin(b.phase) * 0.05 * b.life;
        const r = b.radius * breathe * (0.72 + b.life * 0.28);
        drawLiquidBlob(
          ctx,
          b.x,
          b.y,
          r,
          b.rgb,
          b.life * 0.9,
          b.stretch,
          b.angle + Math.sin(b.phase * 0.5) * 0.12
        );
      }

      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      ro.disconnect();
      cancelAnimationFrame(rafRef.current);
      mqFine.removeEventListener("change", syncEnabled);
      mqWide.removeEventListener("change", syncEnabled);
      mqMotion.removeEventListener("change", syncEnabled);
    };
  }, []);

  return (
    <div
      ref={wrapRef}
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-2xl hidden md:block"
      aria-hidden
    >
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
