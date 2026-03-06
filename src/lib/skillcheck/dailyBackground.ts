/**
 * Daily skillcheck hero background — chosen by today's draft champion region.
 * Images live in public/skillcheck/{regionFolder}/ (e.g. demacia, noxus).
 * Same day boundary as draft cron (UTC date).
 */

import { readdir } from "fs/promises";
import path from "path";

const IMAGE_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif"]);
const DEFAULT_FALLBACK = "background.jpg";
const FALLBACK_REGION = "runeterra";

export function ymdUTC(d = new Date()): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

/** Region display name → folder name (e.g. "Shadow Isles" → "shadow-isles"). */
export function regionToFolderName(region: string): string {
  return region
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");
}

function hash32(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function skillcheckDir(): string {
  return path.join(process.cwd(), "public", "skillcheck");
}

/** List image filenames in public/skillcheck/{regionFolder}/. Returns [] if folder missing or empty. */
export async function getImageNamesInRegionFolder(region: string): Promise<string[]> {
  try {
    const folder = regionToFolderName(region);
    const dir = path.join(skillcheckDir(), folder);
    const files = await readdir(dir);
    const images = files
      .filter((f) => IMAGE_EXT.has(path.extname(f).toLowerCase()))
      .sort();
    return images;
  } catch {
    return [];
  }
}

async function getAllBackgroundImages(): Promise<{ folder: string; filename: string }[]> {
  try {
    const root = skillcheckDir();
    const entries = await readdir(root, { withFileTypes: true } as any);
    const results: { folder: string; filename: string }[] = [];

    for (const entry of entries as any[]) {
      if (!entry.isDirectory?.()) continue;
      const folder = entry.name;
      const dir = path.join(root, folder);
      const files = await readdir(dir);
      for (const f of files) {
        if (IMAGE_EXT.has(path.extname(f).toLowerCase())) {
          results.push({ folder, filename: f });
        }
      }
    }

    return results;
  } catch {
    return [];
  }
}

/**
 * Pick one image path for the day from the given region's folder.
 * Returns path relative to /skillcheck (e.g. "demacia/foo.jpg" or "background.jpg").
 * Falls back to runeterra folder, then to root background.jpg if no images.
 */
export async function getDailyBackgroundPathForRegion(
  region: string,
  dayKey: string
): Promise<string> {
  let images = await getImageNamesInRegionFolder(region);
  let folder = regionToFolderName(region);

  if (images.length === 0 && region !== FALLBACK_REGION) {
    images = await getImageNamesInRegionFolder(FALLBACK_REGION);
    folder = FALLBACK_REGION;
  }

  if (images.length === 0) {
    return DEFAULT_FALLBACK;
  }

  const seed = hash32(`skillcheck:background:${dayKey}`);
  const index = seed % images.length;
  const filename = images[index];
  return `${folder}/${filename}`;
}

/**
 * Pick a background image from any region folder.
 * Used when SKILLCHECK_BACKGROUND_PER_RELOAD is true (per‑reload randomness).
 */
export async function getRandomBackgroundPathAnyRegion(seed: string): Promise<string> {
  const allImages = await getAllBackgroundImages();

  if (allImages.length === 0) {
    return DEFAULT_FALLBACK;
  }

  const hash = hash32(`skillcheck:any-region:${seed}`);
  const index = hash % allImages.length;
  const { folder, filename } = allImages[index];
  return `${folder}/${filename}`;
}

