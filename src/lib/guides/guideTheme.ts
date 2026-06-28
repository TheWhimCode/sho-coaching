/** Pastel palette for guide pages — pink, beige, light blue, eggplant purple. */
export const GUIDE = {
  pink: "#F0ABCF",
  pinkLight: "#FAD4E8",
  pinkSoft: "rgba(240, 171, 207, 0.22)",
  beige: "#F5E6D3",
  beigeMuted: "rgba(245, 230, 211, 0.72)",
  lightBlue: "#B8D8EA",
  lightBlueSoft: "rgba(184, 216, 234, 0.22)",
  eggplant: "#4A354F",
  eggplantDark: "#2A1F2E",
  eggplantDeep: "#1E1724",
  text: "#F5EDE6",
  textMuted: "rgba(245, 237, 230, 0.62)",
} as const;

export const guidePageBg = [
  `radial-gradient(ellipse 90% 55% at 15% -5%, ${GUIDE.pinkSoft}, transparent 50%)`,
  `radial-gradient(ellipse 70% 45% at 95% 10%, ${GUIDE.lightBlueSoft}, transparent 48%)`,
  `radial-gradient(ellipse 60% 40% at 50% 100%, rgba(74, 53, 79, 0.45), transparent 55%)`,
  GUIDE.eggplantDeep,
].join(", ");

/** Section titles sit inset on mobile while panels stay full-bleed. */
export const guideSectionHeaderPadClass = "px-6 sm:px-0";

/** Strip side radius/borders on mobile so panels span the viewport width. */
export const guideMobileFlushPanelClass =
  "max-sm:rounded-none max-sm:border-x-0 max-sm:ring-0";

/** Outermost rune section shell — tight padding so inner panels get more room */
export const guideRuneOuterPanelClass =
  "overflow-hidden rounded-none border border-[#F0ABCF]/15 bg-[#2A1F2E]/75 p-3 ring-1 ring-[#B8D8EA]/10 backdrop-blur-sm sm:rounded-2xl sm:p-4";

/** Gap between rune columns and between runes ↔ explanations */
export const guideRuneLayoutGapClass = "gap-6";

/** Shared panel shell used by rune + item sections */
export const guidePanelClass =
  "overflow-hidden rounded-2xl border border-[#F0ABCF]/15 bg-[#2A1F2E]/75 p-4 ring-1 ring-[#B8D8EA]/10 backdrop-blur-sm sm:p-6 lg:p-8";

export const guideInnerPanelClass =
  "rounded-none border border-[#F0ABCF]/12 border-x-0 bg-[#1E1724]/55 p-4 sm:rounded-xl sm:border-x sm:p-5";

export const guideSectionTitleClass =
  "text-2xl font-bold tracking-tight text-[#F5E6D3] sm:text-3xl";

export const guideSectionSubClass =
  "mt-2 max-w-2xl text-sm text-[#F5E6D3]/60 sm:text-base";

export const guideNavPillClass =
  "rounded-full bg-[#F0ABCF]/18 px-4 py-1.5 font-medium text-[#FAD4E8] ring-1 ring-[#F0ABCF]/35 transition hover:bg-[#F0ABCF]/28";

/** Champion portrait inside a fixed frame — 10% zoom, container size unchanged. */
export const guideChampionIconImgClass = "h-full w-full scale-110 object-cover";
