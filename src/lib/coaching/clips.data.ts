// lib/coaching/clips.data.ts
export type ClipData = {
  id: string;
  title: string;
  subtitle?: string;
  tag?: string;
  videoSrc: string;
  posterSrc?: string;
  gradient: string;
};

export const CLIPS: ClipData[] = [
  {
    id: "clip-1",
    title: "Clean Engage",
    subtitle: "Nautilus Example",
    tag: "Mechanics",
    videoSrc: "/videos/coaching/clips/Placeholder_Pyke.mp4",
    posterSrc: "/clips/posters/akali.jpg",
    gradient:
      "linear-gradient(180deg, rgba(60,120,140,.42) 0%, rgba(40,90,110,.42) 100%)",
  },
  {
    id: "clip-2",
    title: "Perfect Spacing",
    subtitle: "Ezreal Kiting",
    tag: "Positioning",
    videoSrc: "/videos/coaching/clips/Placeholder_Pyke.mp4",
    posterSrc: "/clips/posters/akali.jpg",
    gradient:
      "linear-gradient(180deg, rgba(55,95,150,.42) 0%, rgba(40,75,120,.42) 100%)",
  },
  {
    id: "clip-3",
    title: "Wave Control",
    subtitle: "Orianna Setup",
    tag: "Macro",
    videoSrc: "/videos/coaching/clips/Placeholder_Pyke.mp4",
    posterSrc: "/clips/posters/akali.jpg",
    gradient:
      "linear-gradient(180deg, rgba(80,70,150,.42) 0%, rgba(65,55,120,.42) 100%)",
  },
  {
    id: "clip-4",
    title: "Flawless Combo",
    subtitle: "Lee Sin Insec",
    tag: "Mechanics",
    videoSrc: "/videos/coaching/clips/Placeholder_Pyke.mp4",
    posterSrc: "/clips/posters/akali.jpg",
    gradient:
      "linear-gradient(180deg, rgba(60,120,140,.42) 0%, rgba(40,90,110,.42) 100%)",
  },
  {
    id: "clip-5",
    title: "Objective Setup",
    subtitle: "Baron Control",
    tag: "Macro",
    videoSrc: "/videos/coaching/clips/Placeholder_Pyke.mp4",
    posterSrc: "/clips/posters/akali.jpg",
    gradient:
      "linear-gradient(180deg, rgba(55,95,150,.42) 0%, rgba(40,75,120,.42) 100%)",
  },
  {
    id: "clip-6",
    title: "Teamfight Clutch",
    subtitle: "Kai'Sa Carry",
    tag: "Execution",
    videoSrc: "/videos/coaching/clips/Placeholder_Pyke.mp4",
    posterSrc: "/clips/posters/akali.jpg",
    gradient:
      "linear-gradient(180deg, rgba(80,70,150,.42) 0%, rgba(65,55,120,.42) 100%)",
  },
];
