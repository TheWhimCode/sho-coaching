export type PayMethod = "" | "card" | "paypal";

export type Breakdown = {
  baseEUR: number;
  extraEUR: number;
  extraLabel: string;
  followupsEUR: number;
  total: number;
};
