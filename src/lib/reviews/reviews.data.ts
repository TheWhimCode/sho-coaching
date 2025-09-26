// src/lib/reviews/reviews.data.ts
export type Review = {
  name: string;
  text: string;
  rating?: number;
  /** e.g. "Gold II", "Platinum IV", "Master" */
  rankFrom?: string;
  rankTo?: string;
  avatar?: string;      // optional manual override
  champion?: string;    // ✅ set this to a LoL champion name (e.g., "Viktor")
};

// Example data — now using `champion` (no need to set `avatar`)
export const REVIEWS: Review[] = [
  {
    name: "Yokah",
    text:
      "Thanks to Sho's coaching, I was truly able to reach a Grandmaster level. He helped me realize some major issues that were holding me back from climbing in Elo.",
    rankFrom: "Master",
    rankTo: "Grandmaster",
    champion: "Akali",
  },
  {
    name: "Marco",
    text:
      "Super clear, no fluff. He spotted macro mistakes fast and explained the why behind every change. Notes after the call kept me accountable and I climbed steadily the following week.",
    rankFrom: "Silver I",
    rankTo: "Gold III",
    champion: "Viktor",
  },
  {
    name: "Ari",
    text:
      "Exactly what I needed: targeted fixes and a calm, professional vibe. Hearing my thought process challenged in real time helped me break autopilot and play with intention again.",
    rankFrom: "Platinum IV",
    rankTo: "Diamond III",
    champion: "Viktor",
  },
  {
    name: "EricIsOnFire",
    text:
      "Coach did a great job pointing out a few fundamental errors that held me back from carrying as much as I can. He also showed genuine interest in revisiting and seeing my progress.",
    rankFrom: "Bronze IV",
    rankTo: "Silver IV",
    champion: "Viktor",
  },
  {
    name: "Wham",
    text:
      "I've learned pretty much all of my fundamentals from Sho. He made me realize that my mechanics, macro and especially mental needed work. Took me a while, but I got there.",
    rankFrom: "Diamond I",
    rankTo: "Challenger",
    champion: "Viktor",
  },
  {
    name: "Wham",
    text:
      "I am the wham and I WILL EAT YOU. Chocolate bar, Toby, sleepy, doom!I am the wham and I WILL EAT YOU. Chocolate bar, Toby, sleepy, doom! Awooooo.",
    rankFrom: "Diamond I",
    rankTo: "Challenger",
    champion: "Viktor",
  },
  {
    name: "Wham",
    text:
      "I am the wham and I WILL EAT YOU. Chocolate bar, Toby, sleepy, doom!I am the wham and I WILL EAT YOU. Chocolate bar, Toby, sleepy, doom! Awooooo.",
    rankFrom: "Diamond I",
    rankTo: "Challenger",
    champion: "Viktor",
  },
];
