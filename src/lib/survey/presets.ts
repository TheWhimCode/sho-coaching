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
    id: "time",
    question: "What kind of advice are you looking for?",
    options: [
      { label: "I just have some questions", value: "t_30", preset: "instant" },
      { label: "I want an analysis on my early, mid and lategame", value: "t_60", preset: "vod" },
      { label: "I want Sho to figure out my biggest mistakes", value: "t_sig", preset: "signature" },
      { label: "I wanna just start a session and see where it goes", value: "t_custom", preset: "custom" },
    ],
  },
  {
    id: "goal",
    question: "What's your goal?",
    options: [
      { label: "I just want to see how far I can go", value: "g_quick", preset: "instant" },
      { label: "Learn about the game, avoid bad habits, practise fundamentals", value: "g_deep", preset: "vod" },
      { label: "Climb ASAP, ideally a few divisions in the coming weeks", value: "g_plan", preset: "signature" },
      { label: "My goals are beyond your comprehension. I will beat Faker one day.", value: "g_custom", preset: "custom" },
    ],
  },
  {
    id: "rank",
    question: "What level do you currently play at?",
    options: [
      { label: "I'm Iron - Bronze / a new player", value: "f_short", preset: "instant" },
      { label: "I'm Master+ you fool.", value: "f_vod", preset: "vod" },
      { label: "Like any normal person, I perform at Silver - Diamond level", value: "f_sig", preset: "signature" },
      { label: "My rank doesn't really matter as I have a special request", value: "f_custom", preset: "custom" },
    ],
  },
  {
    id: "followups",
    question: "How important is follow-up support?",
    options: [
      { label: "Not necessary", value: "fu_none", preset: "instant" },
      { label: "Nice to have", value: "fu_nice", preset: "vod" },
      { label: "Essential for me", value: "fu_ess", preset: "signature" },
      { label: "Let’s discuss custom support", value: "fu_custom", preset: "custom" },
    ],
  },
  {
    id: "experience",
    question: "What best describes your experience level?",
    options: [
      { label: "I need quick triage", value: "e_triage", preset: "instant" },
      { label: "I want rigorous review", value: "e_rigorous", preset: "vod" },
      { label: "I want a guided path", value: "e_guided", preset: "signature" },
      { label: "I have edge-case needs", value: "e_custom", preset: "custom" },
    ],
  },
];
