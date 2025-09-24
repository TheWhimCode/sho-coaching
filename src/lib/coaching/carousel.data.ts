export type CarouselItem = {
  title: string;
  videoSrc: string;
  posterSrc?: string;   // used for instant display
  imageAlt?: string;
};

const VIDEO = "/videos/coaching/clips/Placeholder_Pyke.mp4";

export const CAROUSEL_ITEMS: CarouselItem[] = [
  { title: "Wave management",   videoSrc: VIDEO, posterSrc: "/videos/coaching/posters/wave.webp", imageAlt: "Wave management" },
  { title: "Roaming",           videoSrc: VIDEO, posterSrc: "/videos/coaching/posters/roaming.webp", imageAlt: "Roaming" },
  { title: "Positioning",       videoSrc: VIDEO, posterSrc: "/videos/coaching/posters/positioning.webp", imageAlt: "Positioning" },
  { title: "Combos",            videoSrc: VIDEO, posterSrc: "/videos/coaching/posters/combos.webp", imageAlt: "Combos" },
  { title: "Trading",           videoSrc: VIDEO, posterSrc: "/videos/coaching/posters/trading.webp", imageAlt: "Trading" },
  { title: "Midgame macro",     videoSrc: VIDEO, posterSrc: "/videos/coaching/posters/midgame.webp", imageAlt: "Midgame macro" },
  { title: "Objective control", videoSrc: VIDEO, posterSrc: "/videos/coaching/posters/objective.webp", imageAlt: "Objective control" },
];
