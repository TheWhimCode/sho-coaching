import type { Preset } from "../rules/preset";

export type ProductId =
  | "vod"
  | "signature"
  | "instant"
  | "custom"
  | "bundle_4x60"
  | "bundle_bootcamp";

export type Product = {
  preset: Preset;
  customizationAllowed: boolean;
  durationOverrideMin?: number;
  priceOverrideEUR?: number;
  isBundle?: boolean;
    sessionsCount?: number;   // <-- add here

};

export const products: Record<ProductId, Product> = {
  vod: {
    preset: "vod",
    customizationAllowed: true,
  },

  signature: {
    preset: "signature",
    customizationAllowed: true,
  },

  instant: {
    preset: "instant",
    customizationAllowed: true,
  },

  custom: {
    preset: "custom",
    customizationAllowed: true,
  },

  bundle_4x60: {
    preset: "bundle_4x60",
    isBundle: true,
    customizationAllowed: false,
    durationOverrideMin: 60,
    priceOverrideEUR: 110,
      sessionsCount: 4,

  },

  bundle_bootcamp: {
    preset: "bundle_bootcamp",
    isBundle: true,
    customizationAllowed: false,
    durationOverrideMin: 60,
    priceOverrideEUR: 300,
  },
};
