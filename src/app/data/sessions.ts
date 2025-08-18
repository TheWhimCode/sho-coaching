export type Session = {
  slug: string;
  title: string;
  subtitle: string;
  duration: number;
  badge: string;
  cardGradient: string;
};

export const SESSIONS: Session[] = [
  { slug: "vod-review", title: "VOD review", subtitle: "in-depth gameplay analysis", duration: 60,  badge: "most informative session",
    cardGradient: "bg-gradient-to-br from-indigo-500 via-blue-600 to-violet-700" },
  { slug: "signature", title: "Signature session", subtitle: "deep dive + tailored roadmap", duration: 90, badge: "best overall",
    cardGradient: "bg-gradient-to-br from-fuchsia-500 via-rose-600 to-amber-500" },
  { slug: "quick-20", title: "Quick 20 min", subtitle: "rapid-fire fixes & priorities", duration: 20, badge: "fastest feedback",
    cardGradient: "bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-600" },
  { slug: "bootcamp", title: "Custom bootcamp", subtitle: "multi-session improvement arc", duration: 120, badge: "max improvement",
    cardGradient: "bg-gradient-to-br from-sky-500 via-blue-600 to-slate-700" },
];

export const POSTER_SRC: Record<string,string> = {
  "vod-review": "/videos/vod-review-poster-start.png",
  "signature":  "/videos/signature-poster.jpg",
  "quick-20":   "/videos/quick-20-poster.jpg",
  "bootcamp":   "/videos/bootcamp-poster.jpg",
};

export const VIDEO_SRC: Record<string,string> = {
  "vod-review": "/videos/vod-review-bg.mp4",
  "signature":  "/videos/signature-preview.mp4",
  "quick-20":   "/videos/quick-20-preview.mp4",
  "bootcamp":   "/videos/bootcamp-preview.mp4",
};

export const TINT_BY_SLUG: Record<string,string> = {
  "vod-review": "hsl(220 90% 55%)",
  "signature":  "hsl(30 90% 55%)",
  "quick-20":   "hsl(160 70% 45%)",
  "bootcamp":   "hsl(270 70% 60%)",
};

export const END_FRAME_SRC: Record<string, string> = {
  "vod-review": "/videos/vod-review-poster-end.png",
  "signature":  "/videos/signature-end.png",
  "quick-20":   "/videos/quick-20-end.png",
  "bootcamp":   "/videos/bootcamp-end.png",
};

