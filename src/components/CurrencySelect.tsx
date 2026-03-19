import type { Currency } from "../types.ts";
import {
  CURRENCY_NAMES,
  CURRENCY_SYMBOLS,
  SUPPORTED_CURRENCIES,
} from "../currencies.ts";

interface CurrencySelectProps {
  value: Currency;
  onChange: (value: Currency) => void;
  label?: string;
  id?: string;
}

export function CurrencySelect(
  { value, onChange, label, id }: CurrencySelectProps,
) {
  return (
    <div className="input-group">
      {label && <label htmlFor={id} className="input-label">{label}</label>}
      <div className="select-wrapper">
        <select
          id={id}
          className="currency-select neon-border"
          value={value}
          onChange={(e) =>
            onChange((e.target as HTMLSelectElement).value as Currency)}
        >
          {SUPPORTED_CURRENCIES.map((currency) => (
            <option key={currency} value={currency}>
              {CURRENCY_SYMBOLS[currency]} {currency} -{" "}
              {CURRENCY_NAMES[currency]}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
