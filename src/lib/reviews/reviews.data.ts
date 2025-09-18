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
    name: "Lena",
    text:
      "The session was eye-opening. Sho identified habits I didn’t notice and gave me 3 simple priorities to focus on. I felt improvement the next day and finally understand where my time is best spent.",
    rating: 5,
    rankFrom: "Gold II",
    rankTo: "Platinum IV",
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
    name: "Jonas",
    text:
      "I’ve tried coaching before—this was different. Structured, practical, and honest. The roadmap gave me certainty and the follow-up made sure I actually applied the changes.",
    rating: 5,
    rankFrom: "Emerald II",
    rankTo: "Diamond IV",
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
