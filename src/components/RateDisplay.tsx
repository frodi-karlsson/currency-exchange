import type { Rate } from "../types.ts";
import { CURRENCY_SYMBOLS } from "../currencies.ts";

interface RateDisplayProps {
  rate: Rate | null;
  fromCurrency: string;
  toCurrency: string;
  amount: number;
  loading?: boolean;
  cached?: boolean;
  date?: string;
}

function formatNumber(num: number, decimals: number = 2): string {
  return num.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function RateDisplay(
  { rate, fromCurrency, toCurrency, amount, loading, cached, date }:
    RateDisplayProps,
) {
  const convertedAmount = rate !== null ? amount * rate : null;

  if (loading) {
    return (
      <div className="rate-container loading">
        <div className="rate-value">---</div>
        <div className="rate-label">Loading...</div>
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

  const fromSymbol =
    CURRENCY_SYMBOLS[fromCurrency as keyof typeof CURRENCY_SYMBOLS];
  const toSymbol =
    CURRENCY_SYMBOLS[toCurrency as keyof typeof CURRENCY_SYMBOLS];
  const displayDate = date ? ` (${date})` : " (latest)";

  return (
    <div className={`rate-container ${cached ? "cached" : ""}`}>
      <div className="rate-value">
        {toSymbol}{" "}
        {convertedAmount !== null ? formatNumber(convertedAmount, 2) : "---"}
      </div>
      <div className="rate-label">
        {fromSymbol} {formatNumber(amount, 2)} {fromCurrency} = {toSymbol}{" "}
        {convertedAmount !== null ? formatNumber(convertedAmount, 2) : "---"}
        {" "}
        {toCurrency}
      </div>
      <div
        className="rate-label"
        style={{ fontSize: "0.75rem", marginTop: "var(--spacing-xs)" }}
      >
        1 {fromCurrency} = {rate.toFixed(4)} {toCurrency}
        {displayDate}
      </div>
    </div>
  );
}
