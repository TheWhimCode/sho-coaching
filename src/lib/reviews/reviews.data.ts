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
    name: "Kefla",
    text:
      "After our session, I really started to focus on my macro and what my role is supposed to do as an enchanter support. After practising, the game started to play itself. Like a checklist.",
    rankFrom: "Emerald I",
    rankTo: "Master",
    champion: "Milio",
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
    name: "Toby",
    text:
      "I did not realize how much of an impact a terrible mentality had on my games. Sho taught me macro, micro, but most importantly: how to actually try to win every day. I recommend!",
    rankFrom: "Diamond I",
    rankTo: "Challenger",
    champion: "Draven",
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
    name: "BunnyBeast",
    text:
      "I have weapons.",
    rankFrom: "Grandmaster",
    rankTo: "Challenger",
    champion: "Aphelios",
  },

];
