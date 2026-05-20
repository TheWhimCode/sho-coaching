/** RGB tuple */
export type RGB = { r: number; g: number; b: number };

const WHITE: RGB = { r: 255, g: 255, b: 255 };

export function parseAccentRgb(hex: string): RGB | null {
  const raw = hex.trim().replace(/^#/, "");
  if (!/^[0-9a-fA-F]{3,8}$/.test(raw)) return null;
  const h =
    raw.length === 3
      ? raw
          .split("")
          .map((c) => c + c)
          .join("")
      : raw.slice(0, 6);
  const n = parseInt(h, 16);
  if (!Number.isFinite(n)) return null;
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function mix(a: RGB, b: RGB, t: number): RGB {
  return {
    r: Math.round(a.r + (b.r - a.r) * t),
    g: Math.round(a.g + (b.g - a.g) * t),
    b: Math.round(a.b + (b.b - a.b) * t),
  };
}

function luminance({ r, g, b }: RGB): number {
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

/** t=0 full accent, t=1 white — strongly biased toward accent. */
function randomMixFactor(): number {
  if (Math.random() < 0.07) {
    return 0.38 + Math.random() * 0.22;
  }
  return Math.pow(Math.random(), 4);
}

export function tintRgb(accent: string, t: number): RGB {
  const parsed = parseAccentRgb(accent);
  if (!parsed) return { r: 96, g: 136, b: 255 };
  if (luminance(parsed) > 0.88) {
    const gray: RGB = { r: 130, g: 130, b: 130 };
    return mix(gray, WHITE, Math.min(1, t * 0.85));
  }
  return mix(parsed, WHITE, t);
}

export function randomBlobRgb(accent: string): RGB {
  return tintRgb(accent, randomMixFactor());
}

export function cursorPoolRgb(accent: string): RGB {
  return tintRgb(accent, 0.1);
}

export function rgba(c: RGB, a: number): string {
  return `rgba(${c.r},${c.g},${c.b},${a})`;
}
