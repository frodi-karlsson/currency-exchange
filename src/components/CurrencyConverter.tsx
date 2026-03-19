import { useEffect, useState } from "react";
import type { Currency, Rate } from "../types.ts";
import { CurrencyService } from "../currency-service.ts";
import { CacheConnector } from "../cache-connector.ts";
import { WebClient } from "@anabranch/web-client";
import { CurrencySelect } from "./CurrencySelect.tsx";
import { RateDisplay } from "./RateDisplay.tsx";

const FRANKFURTER_MIN_DATE = "1999-01-04";

export function CurrencyConverter() {
  const [fromCurrency, setFromCurrency] = useState<Currency>("USD");
  const [toCurrency, setToCurrency] = useState<Currency>("SEK");
  const [rate, setRate] = useState<Rate | null>(null);
  const [amount, setAmount] = useState<number>(1);
  const [inputValue, setInputValue] = useState<string>("1");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [cached, setCached] = useState(false);
  const [service, setService] = useState<CurrencyService | null>(null);

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    const cache = new CacheConnector();
    const client = WebClient.create().withBaseUrl(
      "https://api.frankfurter.app",
    );

    cache.connect().then(() => {
      setService(new CurrencyService(cache, client));
    });

    return () => {
      cache.close();
    };
  }, []);

  useEffect(() => {
    if (!service) return;

    const fetchRate = async () => {
      setLoading(true);
      setCached(false);

      const date = selectedDate || undefined;
      const result = await service.getRate(fromCurrency, toCurrency, date)
        .result();

      if (result.type === "success") {
        setRate(result.value);
      } else {
        console.error("Failed to fetch rate:", result.error);
        setRate(null);
      }

      setLoading(false);
    };

    fetchRate();
  }, [service, fromCurrency, toCurrency, selectedDate]);

  const handleSwap = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  const handleAmountChange = (value: string) => {
    setInputValue(value);
    const num = parseFloat(value);
    setAmount(isNaN(num) || num < 0 ? 0 : num);
  };

  return (
    <div className="converter">
      <style>
        {`
        .converter {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-md);
        }
        
        .amount-date-row {
          display: flex;
          gap: var(--spacing-sm);
        }
        
        .amount-date-row > * {
          flex: 1;
        }
        
        .amount-input {
          width: 100%;
          padding: var(--spacing-sm);
          font-family: var(--font-mono);
          font-size: 1rem;
          font-weight: 600;
          background: var(--color-bg-secondary);
          color: var(--color-text-primary);
          border: 2px solid var(--color-accent-tertiary);
          transition: all var(--transition-fast);
        }
        
        .amount-input:focus {
          outline: none;
          background: var(--color-bg-tertiary);
          box-shadow: 0 0 0 4px var(--color-accent-tertiary);
        }
        
        .date-input {
          width: 100%;
          padding: var(--spacing-sm);
          font-family: var(--font-mono);
          font-size: 1rem;
          font-weight: 600;
          background: var(--color-bg-secondary);
          color: var(--color-text-primary);
          border: 2px solid var(--color-accent-primary);
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        
        .date-input:focus {
          outline: none;
          background: var(--color-bg-tertiary);
          box-shadow: 0 0 0 4px var(--color-accent-primary);
        }
        
        .clear-btn {
          flex: 0 0 auto;
          padding: 0.6875rem var(--spacing-sm);
          background: transparent;
          border: 2px solid var(--color-text-secondary);
          color: var(--color-text-secondary);
          cursor: pointer;
          font-family: var(--font-mono);
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          transition: all var(--transition-fast);
        }
        
        .clear-btn:hover:not(:disabled) {
          background: var(--color-accent-primary);
          border-color: var(--color-accent-primary);
          color: var(--color-text-primary);
        }
        
        .clear-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .currency-row {
          display: flex;
          gap: var(--spacing-sm);
          align-items: flex-end;
        }
        
        .currency-row > * {
          flex: 1;
        }
        
        .swap-btn {
          flex: 0 0 auto;
          padding: var(--spacing-sm);
          background: transparent;
          border: 3px solid var(--color-accent-secondary);
          color: var(--color-accent-secondary);
          cursor: pointer;
          font-size: 1.5rem;
          font-weight: 700;
          transition: all var(--transition-fast);
          box-shadow: 3px 3px 0 var(--color-accent-secondary);
        }
        
        .swap-btn:hover {
          background: var(--color-accent-secondary);
          color: var(--color-bg-primary);
          transform: translate(-1px, -1px);
          box-shadow: 4px 4px 0 var(--color-accent-secondary);
        }
        
        .rate-container {
          padding: var(--spacing-lg);
          text-align: center;
          animation: slide-up var(--transition-normal) forwards;
        }
        `}
      </style>

      <div className="amount-date-row">
        <div className="input-group">
          <label className="input-label" htmlFor="amount">Amount</label>
          <input
            type="number"
            id="amount"
            className="amount-input"
            value={inputValue}
            onChange={(e) => handleAmountChange(e.target.value)}
            min="0"
            step="0.01"
          />
        </div>
        <div className="input-group">
          <label className="input-label" htmlFor="date">Date</label>
          <input
            type="date"
            id="date"
            className="date-input"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            min={FRANKFURTER_MIN_DATE}
            max={today}
          />
        </div>
        <button
          type="button"
          className="clear-btn"
          onClick={() => setSelectedDate("")}
          disabled={!selectedDate}
        >
          Latest
        </button>
      </div>

      <div className="currency-row">
        <CurrencySelect
          id="from-currency"
          label="From"
          value={fromCurrency}
          onChange={setFromCurrency}
        />
        <button type="button" className="swap-btn" onClick={handleSwap}>
          ⇄
        </button>
        <CurrencySelect
          id="to-currency"
          label="To"
          value={toCurrency}
          onChange={setToCurrency}
        />
      </div>

      <RateDisplay
        rate={rate}
        fromCurrency={fromCurrency}
        toCurrency={toCurrency}
        amount={amount}
        loading={loading}
        cached={cached}
        date={selectedDate}
      />
    </div>
  );
}
