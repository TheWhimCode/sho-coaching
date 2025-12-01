// engine/session/index.ts

// ─────────────────────────────────────────────────────────────
// Core config + SessionConfig type
// ─────────────────────────────────────────────────────────────
export * from "./config/session";

// ─────────────────────────────────────────────────────────────
// Metadata (pure descriptive/ui-ish data)
// ─────────────────────────────────────────────────────────────
export * from "./metadata/colors";
export * from "./metadata/labels";
export * from "./metadata/steps";

// ─────────────────────────────────────────────────────────────
// Rules (business logic / preset logic / transformations)
// ─────────────────────────────────────────────────────────────
export * from "./rules/preset";

// ─────────────────────────────────────────────────────────────
// If you later add more model/config/pricing/time files,
// add them below, but only once.
// ─────────────────────────────────────────────────────────────
// export * from "./config/pricing";
// export * from "./config/time";
// export * from "./model";
