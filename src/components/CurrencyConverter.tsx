import { useState, useEffect } from "react";
import type { Currency, Rate } from "../types.ts";
import { CurrencyService } from "../currency-service.ts";
import { CacheConnector } from "../cache-connector.ts";
import { WebClient } from "@anabranch/web-client";
import { CurrencySelect } from "./CurrencySelect.tsx";
import { RateDisplay } from "./RateDisplay.tsx";

export function CurrencyConverter() {
  const [fromCurrency, setFromCurrency] = useState<Currency>("USD");
  const [toCurrency, setToCurrency] = useState<Currency>("SEK");
  const [rate, setRate] = useState<Rate | null>(null);
  const [loading, setLoading] = useState(false);
  const [cached, setCached] = useState(false);
  const [service, setService] = useState<CurrencyService | null>(null);

  useEffect(() => {
    const cache = new CacheConnector();
    const client = WebClient.create().withBaseUrl("https://api.frankfurter.app");
    setService(new CurrencyService(cache, client));
    
    return () => {
      cache.close();
    };
  }, []);

  useEffect(() => {
    if (!service) return;

    const fetchRate = async () => {
      setLoading(true);
      setCached(false);
      
      const result = await service.getRate(fromCurrency, toCurrency).result();
      
      if (result.type === "success") {
        setRate(result.value);
      } else {
        console.error("Failed to fetch rate:", result.error);
        setRate(null);
      }
      
      setLoading(false);
    };

    fetchRate();
  }, [service, fromCurrency, toCurrency]);

  const handleSwap = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  return (
    <div className="converter">
      <style>{`
        .converter {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-md);
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
          border: 1px solid var(--color-neon-pink);
          color: var(--color-neon-pink);
          cursor: pointer;
          font-size: 1.25rem;
          transition: all var(--transition-fast);
        }
        
        .swap-btn:hover {
          background: rgba(255, 0, 255, 0.1);
          box-shadow: 0 0 15px var(--color-neon-pink);
        }
        
        .rate-container {
          padding: var(--spacing-lg);
          text-align: center;
          animation: fade-in-up var(--transition-normal) forwards;
        }
        
        .rate-label {
          animation: neon-pulse 2s ease-in-out infinite;
        }
      `}</style>
      
      <div className="currency-row">
        <CurrencySelect
          id="from-currency"
          label="From"
          value={fromCurrency}
          onChange={setFromCurrency}
        />
        <button className="swap-btn neon-border-pink" onClick={handleSwap}>
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
        loading={loading}
        cached={cached}
      />
    </div>
  );
}