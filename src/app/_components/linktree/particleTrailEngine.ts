import {
  cursorPoolRgb,
  randomBlobRgb,
  rgba,
  type RGB,
} from "./accentParticleVariants";

export type ParticleBlob = {
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

type Trail = {
  id: number;
  color: string;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  blobs: ParticleBlob[];
  active: boolean;
  point: { x: number; y: number } | null;
};

const MAX_BLOBS = 28;
const SPAWN_PER_MOVE = 2;
const DRAG = 0.94;
const MIST_RISE = -0.06;

const trails = new Map<number, Trail>();
let nextId = 1;
let rafId = 0;
let loopRunning = false;
let globalEnabled = false;
let mqListenersAttached = false;

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

function spawnBlobs(trail: Trail, px: number, py: number) {
  const list = trail.blobs;
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
      rgb: randomBlobRgb(trail.color),
    });
  }
}

function trailNeedsFrame(trail: Trail) {
  return (trail.active && trail.point !== null) || trail.blobs.length > 0;
}

function anyTrailNeedsFrame() {
  if (!globalEnabled) return false;
  for (const trail of trails.values()) {
    if (trailNeedsFrame(trail)) return true;
  }
  return false;
}

function drawTrail(trail: Trail, now: number) {
  const { ctx, width, height } = trail;
  if (width < 1 || height < 1) return false;

  ctx.clearRect(0, 0, width, height);
  const t = now * 0.001;
  let drew = false;

  if (trail.active && trail.point) {
    const pool = cursorPoolRgb(trail.color);
    const { x, y } = trail.point;
    const pulse = 0.88 + Math.sin(t * 3.2) * 0.12;
    const driftX = Math.sin(t * 1.4) * 3;
    const driftY = Math.cos(t * 1.1) * 2.5;
    drawLiquidBlob(
      ctx,
      x + driftX * 0.35,
      y + driftY * 0.35,
      8 * pulse,
      pool,
      0.62,
      1,
      t * 0.3
    );
    drew = true;
  }

  const list = trail.blobs;
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
    drew = true;
  }

  return drew;
}

function tick(now: number) {
  if (!globalEnabled || trails.size === 0) {
    loopRunning = false;
    return;
  }

  for (const trail of trails.values()) {
    if (trailNeedsFrame(trail)) {
      drawTrail(trail, now);
    } else if (trail.width > 0 && trail.height > 0) {
      trail.ctx.clearRect(0, 0, trail.width, trail.height);
    }
  }

  if (anyTrailNeedsFrame()) {
    rafId = requestAnimationFrame(tick);
  } else {
    loopRunning = false;
  }
}

function ensureLoop() {
  if (!globalEnabled || loopRunning || !anyTrailNeedsFrame()) return;
  loopRunning = true;
  rafId = requestAnimationFrame(tick);
}

function stopLoop() {
  if (!loopRunning) return;
  cancelAnimationFrame(rafId);
  loopRunning = false;
}

function syncGlobalEnabled() {
  if (typeof window === "undefined") return;
  const mqFine = window.matchMedia("(pointer: fine)");
  const mqWide = window.matchMedia("(min-width: 768px)");
  const mqMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  globalEnabled =
    mqFine.matches && mqWide.matches && !mqMotion.matches;

  if (!globalEnabled) {
    stopLoop();
    for (const trail of trails.values()) {
      trail.blobs = [];
      trail.active = false;
      trail.point = null;
      if (trail.width > 0 && trail.height > 0) {
        trail.ctx.clearRect(0, 0, trail.width, trail.height);
      }
    }
  }
}

function attachMqListeners() {
  if (mqListenersAttached || typeof window === "undefined") return;
  mqListenersAttached = true;
  const mqFine = window.matchMedia("(pointer: fine)");
  const mqWide = window.matchMedia("(min-width: 768px)");
  const mqMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  syncGlobalEnabled();
  mqFine.addEventListener("change", syncGlobalEnabled);
  mqWide.addEventListener("change", syncGlobalEnabled);
  mqMotion.addEventListener("change", syncGlobalEnabled);
}

export type ParticleTrailControl = {
  setColor: (color: string) => void;
  setActive: (active: boolean) => void;
  movePointer: (x: number, y: number) => void;
  clear: () => void;
  resize: () => void;
};

export function registerParticleTrail(
  canvas: HTMLCanvasElement,
  color: string
): { id: number; control: ParticleTrailControl } {
  attachMqListeners();

  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) {
    throw new Error("2d context unavailable");
  }
  ctx.imageSmoothingEnabled = true;

  const id = nextId++;
  const trail: Trail = {
    id,
    color,
    canvas,
    ctx,
    width: 0,
    height: 0,
    blobs: [],
    active: false,
    point: null,
  };
  trails.set(id, trail);

  const control: ParticleTrailControl = {
    setColor(nextColor) {
      trail.color = nextColor;
    },
    setActive(active) {
      trail.active = active;
      if (!active) {
        trail.point = null;
        trail.blobs = [];
        if (trail.width > 0 && trail.height > 0) {
          trail.ctx.clearRect(0, 0, trail.width, trail.height);
        }
        if (!anyTrailNeedsFrame()) stopLoop();
        return;
      }
      ensureLoop();
    },
    movePointer(x, y) {
      trail.point = { x, y };
      if (!trail.active || !globalEnabled) return;
      spawnBlobs(trail, x, y);
      ensureLoop();
    },
    clear() {
      trail.active = false;
      trail.point = null;
      trail.blobs = [];
      if (trail.width > 0 && trail.height > 0) {
        trail.ctx.clearRect(0, 0, trail.width, trail.height);
      }
      if (!anyTrailNeedsFrame()) stopLoop();
    },
    resize() {
      const wrap = canvas.parentElement;
      if (!wrap) return;
      const { width, height } = wrap.getBoundingClientRect();
      if (width < 1 || height < 1) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      trail.width = width;
      trail.height = height;
    },
  };

  control.resize();
  return { id, control };
}

export function unregisterParticleTrail(id: number) {
  const trail = trails.get(id);
  if (!trail) return;
  trails.delete(id);
  if (trail.width > 0 && trail.height > 0) {
    trail.ctx.clearRect(0, 0, trail.width, trail.height);
  }
  if (!anyTrailNeedsFrame()) stopLoop();
}
