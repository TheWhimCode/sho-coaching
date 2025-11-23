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
    name: "Redemption",
    text:
      "Sho took my scattered and vague approach to the game that is so common in the lower elos and helped sharpen it into something much more focused and intentional.",
    rankFrom: "Bronze I",
    rankTo: "Platinum IV",
    champion: "Lux",
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
    name: "BunnyBeast",
    text:
      "I have weapons.",
    rankFrom: "Grandmaster",
    rankTo: "Challenger",
    champion: "Aphelios",
  },
  {
    name: "Kefla",
    text:
      "Gather 'round, fwens!",
    rankFrom: "Emerald I",
    rankTo: "Master",
    champion: "Milio",
  },
];
