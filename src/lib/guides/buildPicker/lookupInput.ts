import { BUILD_PICKER_PLATFORMS, type BuildPickerPlatformId } from "./types";

/** Wait for a plausible complete ID so short numeric name fragments do not switch modes. */
export function matchInputPlatform(value: string): BuildPickerPlatformId | "selected" | null {
  const cleaned = value.trim().replace(/\s+/g, "");
  if (/^\d{6,}$/.test(cleaned)) return "selected";
  const match = /^([a-zA-Z0-9]+)_\d+$/.exec(cleaned);
  const platform = match?.[1].toLowerCase();
  return BUILD_PICKER_PLATFORMS.find((entry) => entry.id !== "auto" && entry.id === platform)?.id ?? null;
}
