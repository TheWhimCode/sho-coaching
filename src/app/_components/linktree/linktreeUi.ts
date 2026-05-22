/** Shared responsive layout + button sizing for the homepage link tree */

export const LINKTREE_PAGE_INNER =
  "relative z-20 flex w-full min-h-[100svh] flex-col items-center justify-center px-4 py-12 sm:px-6 sm:py-14 md:py-16 lg:px-8 lg:py-20";

export const LINKTREE_LIST =
  "mx-auto flex w-full list-none flex-col gap-2.5 p-0 m-0 sm:gap-3 md:gap-3.5 max-w-[min(100%,18rem)] sm:max-w-[20rem] md:max-w-[22rem] lg:max-w-[24rem] xl:max-w-[26rem] 2xl:max-w-[28rem]";

export const LINKTREE_BUTTON_INNER =
  "relative z-10 flex w-full items-center gap-2.5 px-3 py-3 transition-transform duration-[220ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.02] group-active:scale-[0.985] sm:gap-3 sm:px-3.5 sm:py-3.5 md:px-4 md:py-4 lg:px-5 lg:py-4";

export const LINKTREE_ICON_TILE =
  "relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-lg transition-transform duration-300 group-hover:scale-105 sm:h-11 sm:w-11 md:h-12 md:w-12 lg:h-[3.25rem] lg:w-[3.25rem]";

export const LINKTREE_TILE_ICON = "h-5 w-5 sm:h-5 sm:w-5 md:h-6 md:w-6 lg:h-7 lg:w-7";

export const LINKTREE_TITLE =
  "text-sm font-semibold tracking-tight text-white sm:text-base md:text-lg lg:text-xl";

export const LINKTREE_DESCRIPTION =
  "mt-0.5 text-xs text-white/55 transition-colors group-hover:text-white/70 sm:text-xs md:text-sm";

export const LINKTREE_SHELL =
  "group relative block w-full overflow-hidden rounded-2xl border border-white/10 bg-[#0B1220]/55 backdrop-blur-md outline-none transition-[border-color,box-shadow] duration-300 focus-visible:ring-2 focus-visible:ring-[var(--link-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#050B18] hover:border-[color-mix(in_srgb,var(--link-accent)_45%,transparent)] hover:shadow-[0_0_0_1px_color-mix(in_srgb,var(--link-accent)_35%,transparent),0_12px_40px_-8px_var(--link-glow),0_0_48px_-12px_var(--link-glow)]";
