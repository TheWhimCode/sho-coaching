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
    question: "How much time do you have for a session?",
    options: [
      { label: "30 minutes", value: "t_30", preset: "instant" },
      { label: "60 minutes", value: "t_60", preset: "vod" },
      { label: "45 + follow-up", value: "t_sig", preset: "signature" },
      { label: "I’m not sure", value: "t_custom", preset: "custom" },
    ],
  },
  {
    id: "goal",
    question: "What’s your main coaching goal?",
    options: [
      { label: "Quick answers to pressing questions", value: "g_quick", preset: "instant" },
      { label: "Deep analysis of my gameplay", value: "g_deep", preset: "vod" },
      { label: "Structured plan + accountability", value: "g_plan", preset: "signature" },
      { label: "Something very specific/unique", value: "g_custom", preset: "custom" },
    ],
  },
  {
    id: "format",
    question: "Preferred format?",
    options: [
      { label: "Short live call, focused fixes", value: "f_short", preset: "instant" },
      { label: "VOD breakdown with detailed notes", value: "f_vod", preset: "vod" },
      { label: "Live deep-dive + roadmap", value: "f_sig", preset: "signature" },
      { label: "I’ll decide later / depends", value: "f_custom", preset: "custom" },
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
