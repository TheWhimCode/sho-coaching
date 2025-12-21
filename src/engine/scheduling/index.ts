// /engine/scheduling/index.ts
// ⚠️ CLIENT-SAFE BARREL ONLY
// Do NOT export Prisma / CFG_SERVER / DB logic from here

// availability (pure logic / data shaping)
export * from "./availability/getDayAvailability";
export * from "./availability/groupByDay";
export * from "./availability/dayCounts";
export * from "./availability/intervalMath";
export * from "./availability/model";

// policy (display / range only — no secrets)
export * from "./policy/display";

// time (pure helpers)
export * from "./time/timeMath";
