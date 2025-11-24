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
    title: "Akshan E reset",
    subtitle: "Nautilus Example",
    tag: "Mechanics",
    videoSrc: "/videos/coaching/clips/Akshan.mp4",
    posterSrc: "/clips/posters/akali.jpg",
    gradient:
      "linear-gradient(180deg, rgba(60,120,140,.42) 0%, rgba(40,90,110,.42) 100%)",
  },
  {
    id: "clip-2",
    title: "Aggro juggling",
    subtitle: "Ezreal Kiting",
    tag: "ADC Laning",
    videoSrc: "/videos/coaching/clips/Kaisa.mp4",
    posterSrc: "/clips/posters/akali.jpg",
    gradient:
      "linear-gradient(180deg, rgba(55,95,150,.42) 0%, rgba(40,75,120,.42) 100%)",
  },
  {
    id: "clip-3",
    title: "Maximizing CC",
    subtitle: "Orianna Setup",
    tag: "Teamfighting",
    videoSrc: "/videos/coaching/clips/Leona.mp4",
    posterSrc: "/clips/posters/akali.jpg",
    gradient:
      "linear-gradient(180deg, rgba(80,70,150,.42) 0%, rgba(65,55,120,.42) 100%)",
  },
  {
    id: "clip-4",
    title: "Yone R pull tech",
    subtitle: "Lee Sin Insec",
    tag: "Mechanics",
    videoSrc: "/videos/coaching/clips/Yone.mp4",
    posterSrc: "/clips/posters/akali.jpg",
    gradient:
      "linear-gradient(180deg, rgba(60,120,140,.42) 0%, rgba(40,90,110,.42) 100%)",
  },
  {
    id: "clip-5",
    title: "Lanegank setup",
    subtitle: "Baron Control",
    tag: "Ganking",
    videoSrc: "/videos/coaching/clips/Placeholder_Pyke.mp4",
    posterSrc: "/clips/posters/akali.jpg",
    gradient:
      "linear-gradient(180deg, rgba(55,95,150,.42) 0%, rgba(40,75,120,.42) 100%)",
  },
  {
    id: "clip-6",
    title: "Using CC setup",
    subtitle: "Kai'Sa Carry",
    tag: "Execution",
    videoSrc: "/videos/coaching/clips/Nida.mp4",
    posterSrc: "/clips/posters/akali.jpg",
    gradient:
      "linear-gradient(180deg, rgba(80,70,150,.42) 0%, rgba(65,55,120,.42) 100%)",
  },
];
