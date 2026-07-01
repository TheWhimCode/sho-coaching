/** Coaching page images — shared for preload hints and UI */

import { coachingSquareButtonImage } from "@/lib/coaching/coachingClipVideos";

export const COACHING_CARD_IMAGES = [
  "/images/sessions/VOD7.webp",
  "/images/sessions/Signature3.webp",
  "/images/sessions/Rush.webp",
] as const;

export const COACHING_EXAMPLE_IMAGES = [
  coachingSquareButtonImage("Irelia.png"),
  coachingSquareButtonImage("Shyvana7.png"),
  coachingSquareButtonImage("Syndra8.png"),
  coachingSquareButtonImage("Aphelios.svg"),
  coachingSquareButtonImage("Nami.png"),
] as const;

export const COACHING_PRELOAD_IMAGES = [
  ...COACHING_CARD_IMAGES,
  ...COACHING_EXAMPLE_IMAGES,
] as const;

export const COACHING_FOLLOWUP_EXAMPLE_IMAGE = coachingSquareButtonImage("Azir2.png");
