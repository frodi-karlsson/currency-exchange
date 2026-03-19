import { Task } from "@anabranch/anabranch";
import type { CacheAdapter } from "@anabranch/cache";
import type { WebClient } from "@anabranch/web-client";
import type { Rate, Currency, RateResponse, CachedRate } from "./types.ts";
import { InvalidCurrencyError, NetworkError, NoDataError } from "./errors.ts";
import { isValidCurrency } from "./currencies.ts";

export class CurrencyService {
  constructor(
    private cache: CacheAdapter,
    private client: WebClient
  ) {}

  static buildCacheKey(from: Currency, to: Currency, date?: string): string {
    const datePart = date ?? "latest";
    return `currency:${from}:${to}:${datePart}`;
  }

  getRate(from: Currency, to: Currency, date?: string): Task<Rate, InvalidCurrencyError | NetworkError | NoDataError> {
    return Task.of(async () => {
      if (!isValidCurrency(from)) {
        throw new InvalidCurrencyError(from);
      }
      if (!isValidCurrency(to)) {
        throw new InvalidCurrencyError(to);
      }

      const cacheKey = CurrencyService.buildCacheKey(from, to, date);

      const cached = await this.cache.get(cacheKey) as CachedRate | null;
      if (cached !== null) {
        return cached.rate;
      }

      const datePath = date ?? "latest";
      const url = `/${datePath}?from=${from}&to=${to}`;

      try {
        const response = await this.client.get(url).run();
        const data = response.data as RateResponse;
        
        const rate = data.rates[to];
        if (rate === undefined) {
          throw new NoDataError(from, to, date);
        }

        const ttl = date ? 86400000 : 3600000;
        await this.cache.set(cacheKey, {
          rate,
          fetchedAt: Date.now(),
          date: data.date,
        }, { ttl });

        return rate;
      } catch (err) {
        if (err instanceof InvalidCurrencyError || err instanceof NoDataError) {
          throw err;
        }
        throw new NetworkError(
          err instanceof Error ? err.message : "Network request failed"
        );
      }
    });
  }

  getHistoricalRates(
    from: Currency,
    to: Currency[],
    startDate: string,
    endDate: string
  ): Task<Record<string, Record<Currency, Rate>>, NetworkError | InvalidCurrencyError | NoDataError> {
    return Task.of(async () => {
      if (!isValidCurrency(from)) {
        throw new InvalidCurrencyError(from);
      }
      to.forEach((c) => {
        if (!isValidCurrency(c)) {
          throw new InvalidCurrencyError(c);
        }
      });

      const url = `/${startDate}..${endDate}?from=${from}&to=${to.join(",")}`;

      try {
        const response = await this.client.get(url).run();
        const data = response.data as { rates: Record<string, Record<Currency, Rate>> };
        return data.rates;
      } catch (err) {
        if (err instanceof InvalidCurrencyError) {
          throw err;
        }
        throw new NetworkError(
          err instanceof Error ? err.message : "Network request failed"
        );
      }
    });
  }
}