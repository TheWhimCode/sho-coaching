/** Coaching page images — shared for preload hints and UI */

export const COACHING_CARD_IMAGES = [
  "/images/sessions/VOD7.png",
  "/images/sessions/Signature3.png",
  "/images/sessions/Rush.png",
] as const;

export const COACHING_EXAMPLE_IMAGES = [
  "/images/squarebuttons/Irelia.png",
  "/images/squarebuttons/Shyvana7.png",
  "/images/squarebuttons/Syndra8.png",
  "/images/squarebuttons/Aphelios.svg",
  "/images/squarebuttons/Nami.png",
] as const;

export const COACHING_PRELOAD_IMAGES = [
  ...COACHING_CARD_IMAGES,
  ...COACHING_EXAMPLE_IMAGES,
] as const;
