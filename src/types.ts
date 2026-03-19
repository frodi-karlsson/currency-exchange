import type { Task } from "@anabranch/anabranch";

export type Rate = number;

export type Currency = "USD" | "EUR" | "GBP" | "JPY" | "CHF" | "SEK";

export interface RateResponse {
  base: Currency;
  date: string;
  rates: Partial<Record<Currency, Rate>>;
}

export interface CachedRate {
  rate: Rate;
  fetchedAt: number;
  date: string;
}

// Re-export Task for convenience
export type { Task };