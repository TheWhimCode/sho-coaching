export type FaqItem = {
  q: string;
  a: string | string[];
};

export const FAQ: FaqItem[] = [
  {
    q: "What is a follow-up?",
    a: "A 15-minute video after your session where I review your progress, call out what still isn’t working, and add new information tailored to you.",
  },
  {
    q: "When should I request one?",
    a: "After you’ve played ~10–20 games applying the advice so we can review real patterns instead of single-game noise.",
  },
  {
    q: "What do you need from me?",
    a: [
      "Short notes on what you tried and where you still struggle.",
      "Optional: relevant match links or short clips."
    ],
  },
  {
    q: "How do I add follow-ups?",
    a: "Use the Customize option when booking. Signature includes one follow-up; you can add more via customization anytime.",
  },
  {
    q: "Turnaround time?",
    a: "Typically 48–72 hours after I receive your notes/clips.",
  },
  {
    q: "What do I receive?",
    a: "A private MP4 with timestamps so you can jump to the parts that matter.",
  },
];
