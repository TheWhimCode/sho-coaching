import {
  Scroll,
  Lightning,
  PuzzlePiece,
  Signature,
  StackPlus,
} from "@phosphor-icons/react";
import type { Preset } from "../rules/preset";

export type IconMeta = {
  icon: any;
  weight?: "fill" | "bold" | "regular" | "light";
};

export const iconsByPreset: Record<Preset, IconMeta> = {
  vod: {
    icon: Scroll,
    weight: "fill",
  },

  instant: {
    icon: Lightning,
    weight: "fill",
  },

  signature: {
    icon: Signature,
    weight: "bold", // ⭐ matches original version
  },

  custom: {
    icon: PuzzlePiece,
    weight: "fill",
  },

  // bundles reuse PuzzlePiece for now,
  // but you can replace with a new icon later
  bundle_4x60: {
    icon: StackPlus,
    weight: "fill",
  },

  bundle_bootcamp: {
    icon: PuzzlePiece,
    weight: "fill",
  },
};
