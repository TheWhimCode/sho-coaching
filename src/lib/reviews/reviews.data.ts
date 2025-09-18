// coaching/_coaching-components/reviews.data.ts
export type Review = {
  name: string;
  text: string;
  rating?: number;
  /** e.g. "Gold II", "Platinum IV", "Master" */
  rankFrom?: string;
  rankTo?: string;
};

export const REVIEWS: Review[] = [
  {
    name: "Croatoan",
    text:
"During a VOD review, Sho took his time and gave measured advice for my improvement opportunities. Seeing the mistakes I was making through another's eyes was really informative.",
    rating: 5,
    rankFrom: "Iron III",
    rankTo: "Silver I",
  },
  {
    name: "Marco",
    text:
      "Super clear, no fluff. He spotted macro mistakes fast and explained the why behind every change. Notes after the call kept me accountable and I climbed steadily the following week.",
    rating: 5,
    rankFrom: "Silver I",
    rankTo: "Gold III",
  },
  {
    name: "Ari",
    text:
      "Exactly what I needed: targeted fixes and a calm, professional vibe. Hearing my thought process challenged in real time helped me break autopilot and play with intention again.",
    rating: 5,
    rankFrom: "Platinum IV",
    rankTo: "Diamond III",
  },
  {
    name: "EricIsOnFire",
    text:
"Coach did a great job pointing out a few fundamental errors that held me back from carrying as much as I can. He also showed genuine interest in revisiting and seeing my progress.",
    rating: 5,
    rankFrom: "Bronze IV",
    rankTo: "Silver IV",
  },  
  {
    name: "Wham",
    text:
"I am the wham and I WILL EAT YOU. Chocolate bar, Toby, sleepy, doom!I am the wham and I WILL EAT YOU. Chocolate bar, Toby, sleepy, doom! Awooooo.",    
rating: 5,
    rankFrom: "Diamond I",
    rankTo: "Challenger",
  },
    {
    name: "Wham",
    text:
"I am the wham and I WILL EAT YOU. Chocolate bar, Toby, sleepy, doom!I am the wham and I WILL EAT YOU. Chocolate bar, Toby, sleepy, doom! Awooooo.",    
rating: 5,
    rankFrom: "Diamond I",
    rankTo: "Challenger",
  },  
  {
    name: "Wham",
    text:
"I am the wham and I WILL EAT YOU. Chocolate bar, Toby, sleepy, doom!I am the wham and I WILL EAT YOU. Chocolate bar, Toby, sleepy, doom! Awooooo.",    
rating: 5,
    rankFrom: "Diamond I",
    rankTo: "Challenger",
  },
];
