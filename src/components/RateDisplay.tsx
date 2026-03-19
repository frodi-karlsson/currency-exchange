import type { Rate } from "../types.ts";
import { CURRENCY_SYMBOLS } from "../currencies.ts";

interface RateDisplayProps {
  rate: Rate | null;
  fromCurrency: string;
  toCurrency: string;
  loading?: boolean;
  cached?: boolean;
}

export function RateDisplay(
  { rate, fromCurrency, toCurrency, loading, cached }: RateDisplayProps,
) {
  if (loading) {
    return (
      <div className="rate-container loading">
        <div className="rate-value neon-text">---</div>
      </div>
    );
  }

  if (rate === null) {
    return (
      <div className="rate-container">
        <div
          className="rate-value"
          style={{ color: "var(--color-text-secondary)" }}
        >
          Select currencies to see rate
        </div>
      </div>
    );
  }

  return (
    <div className={`rate-container ${cached ? "cached" : ""}`}>
      <div className="rate-value neon-text animate-neon-pulse">
        {rate.toFixed(4)}
      </div>
      <div
        className="rate-label neon-text-pink"
        style={{ fontSize: "0.875rem", marginTop: "0.5rem" }}
      >
        {CURRENCY_SYMBOLS[fromCurrency as keyof typeof CURRENCY_SYMBOLS]} 1{" "}
        {fromCurrency} ={"  "}
        {CURRENCY_SYMBOLS[toCurrency as keyof typeof CURRENCY_SYMBOLS]}{" "}
        {rate.toFixed(4)} {toCurrency}
      </div>
    </div>
  );
}
