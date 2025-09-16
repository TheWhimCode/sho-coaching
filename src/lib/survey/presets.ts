// lib/survey/presets.ts

export type Preset = "vod" | "signature" | "instant" | "custom";

export type SurveyOption = {
  label: string;
  value: string;     // unique per question
  preset: Preset;    // which preset this answer supports
};

export type SurveyQuestion = {
  id: string;
  question: string;
  options: [SurveyOption, SurveyOption, SurveyOption, SurveyOption]; // exactly 4
};

// answers map: question.id -> option.value
export type SurveyAnswerMap = Record<string, string>;

export const SURVEY: SurveyQuestion[] = [
  {
    id: "focus",
    question: "What kind of advice are you looking for?",
    options: [
      { label: "I wanna just start a session and see where it goes", value: "t_custom", preset: "custom" },
      { label: "I want Sho to figure out my biggest mistakes", value: "t_sig", preset: "signature" },
      { label: "I want an analysis on my early, mid and lategame", value: "t_60", preset: "vod" },
      { label: "I just have some questions", value: "t_30", preset: "instant" },
    ],
  },
  {
    id: "goal",
    question: "What's your goal?",
    options: [
      { label: "Climb ASAP, ideally a few divisions in the coming weeks", value: "g_plan", preset: "signature" },
      { label: "I just want to see how far I can go", value: "g_quick", preset: "instant" },
      { label: "My goals are beyond your comprehension. I will beat Faker one day.", value: "g_custom", preset: "custom" },
      { label: "Learn about the game, avoid bad habits, practise fundamentals", value: "g_deep", preset: "vod" },
    ],
  },
  {
    id: "rank",
    question: "What level do you currently play at?",
    options: [
      { label: "Like most, I perform at Silver - Diamond level", value: "f_sig", preset: "signature" },
      { label: "I'm Iron - Bronze / a new player", value: "f_short", preset: "instant" },
      { label: "My rank doesn't really matter as I have a special request", value: "f_custom", preset: "custom" },
      { label: "I'm Master+ you fool.", value: "f_vod", preset: "vod" },
    ],
  },
  {
    id: "championpool",
    question: "How many champions do you want to look at?",
    options: [
      { label: "1-2 champions", value: "fu_nice", preset: "vod" },
      { label: "I want to main something but don't really know what", value: "fu_none", preset: "instant" },
      { label: "3+ champions", value: "fu_custom", preset: "custom" },
      { label: "1 champion", value: "fu_ess", preset: "signature" },
    ],
  },
  {
    id: "price",
    question: "How much does price matter?",
    options: [
      { label: "I'm just looking for basic coaching and I'll pay for it", value: "e_rigorous", preset: "vod" },
      { label: "I want premium, custom and high quality. Money is no object.", value: "e_custom", preset: "custom" },
      { label: "A lot, I'm not sure I can even afford it", value: "e_triage", preset: "instant" },
      { label: "My biggest concern is the value for money ratio", value: "e_guided", preset: "signature" },
    ],
  },
];
