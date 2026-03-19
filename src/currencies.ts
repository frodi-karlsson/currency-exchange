import type { Currency } from "./types.ts";

export const SUPPORTED_CURRENCIES: Currency[] = [
  "USD",
  "EUR",
  "GBP",
  "JPY",
  "CHF",
  "SEK",
];

export const CURRENCY_NAMES: Record<Currency, string> = {
  USD: "US Dollar",
  EUR: "Euro",
  GBP: "British Pound",
  JPY: "Japanese Yen",
  CHF: "Swiss Franc",
  SEK: "Swedish Krona",
};

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  USD: "$",
  EUR: "\u20AC",
  GBP: "\u00A3",
  JPY: "\u00A5",
  CHF: "Fr",
  SEK: "kr",
};

export function isValidCurrency(code: string): code is Currency {
  return SUPPORTED_CURRENCIES.includes(code as Currency);
}