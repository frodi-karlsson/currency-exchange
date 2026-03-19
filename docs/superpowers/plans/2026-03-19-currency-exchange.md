# Currency Exchange Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Lume-based static site with Islands architecture that displays currency exchange rates with a Neon Cyberpunk aesthetic.

**Architecture:** Browser-layer services (CacheConnector, CurrencyService) use anabranch packages for storage and HTTP. Islands components hydrate on client. Lume handles static generation and TypeScript compilation.

**Tech Stack:** Deno, Lume (static site generator), TypeScript, anabranch/* packages (cache, storage-browser, web-client), Frankfurter API

---

## File Structure

```
currency-exchange/
├── _config.ts                  # Lume configuration
├── deno.json                   # Deno config with imports
├── src/
│   ├── types.ts                # Currency, Rate, RateResponse types
│   ├── errors.ts               # NetworkError, InvalidCurrencyError classes
│   ├── currencies.ts           # SUPPORTED_CURRENCIES, symbols, names
│   ├── cache-connector.ts      # IndexedDB cache adapter for @anabranch/cache
│   ├── currency-service.ts     # API client with caching
│   ├── components/
│   │   ├── CurrencyConverter.tsx  # Main converter Island
│   │   ├── CurrencySelect.tsx      # Dropdown component
│   │   └── RateDisplay.tsx         # Rate display with animation
│   └── styles/
│       └── design-system.css   # Neon Cyberpunk CSS
├── _includes/
│   └── layout.tsx              # Base HTML layout
├── index.tsx                   # Home page (Island entry)
└── tests/
    ├── cache-connector.test.ts
    └── currency-service.test.ts
```

---

## Task 1: Project Setup

**Files:**
- Create: `deno.json`
- Create: `_config.ts`

- [ ] **Step 1: Initialize Lume project**

Run: `deno run -A https://lume.land/init.ts`
Expected: Lume initialization prompts, select defaults

- [ ] **Step 2: Configure Deno imports**

Create `deno.json`:

```json
{
  "tasks": {
    "dev": "deno run -A https://lume.land/dev.ts --serve",
    "build": "deno run -A https://lume.land/dev.ts"
  },
  "imports": {
    "@anabranch/cache": "jsr:@anabranch/cache@^0.1.0",
    "@anabranch/storage": "jsr:@anabranch/storage@^0.1.0",
    "@anabranch/storage-browser": "jsr:@anabranch/storage-browser@^0.1.0",
    "@anabranch/web-client": "jsr:@anabranch/web-client@^0.1.0",
    "@anabranch/anabranch": "jsr:@anabranch/anabranch@^0.1.0"
  },
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "npm:react",
    "jsxImportSourceTypes": "npm:@types/react"
  }
}
```

- [ ] **Step 3: Configure Lume**

Create `_config.ts`:

```typescript
import lume from "lume/mod.ts";
import jsx from "lume/plugins/jsx.ts";
import esbuild from "lume/plugins/esbuild.ts";
import lightningcss from "lume/plugins/lightningcss.ts";

const site = lume({
  src: "./src",
  dest: "./_site",
});

site.use(jsx());
site.use(esbuild({
  extensions: [".ts", ".tsx"],
  options: {
    jsx: "automatic",
    jsxImportSource: "npm:react",
  },
}));
site.use(lightningcss());

export default site;
```

- [ ] **Step 4: Create directory structure**

Run: `mkdir -p src/components src/styles tests _includes`

- [ ] **Step 5: Verify Lume runs**

Run: `deno task dev`
Expected: Lume dev server starts on localhost:3000

---

## Task 2: Core Types and Error Classes

**Files:**
- Create: `src/types.ts`
- Create: `src/errors.ts`
- Create: `src/currencies.ts`

- [ ] **Step 1: Create types**

Create `src/types.ts`:

```typescript
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
```

- [ ] **Step 2: Create error classes**

Create `src/errors.ts`:

```typescript
export class NetworkError extends Error {
  readonly retryable = true;
  constructor(message: string) {
    super(message);
    this.name = "NetworkError";
  }
}

export class CacheError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CacheError";
  }
}

export class InvalidCurrencyError extends Error {
  constructor(readonly currency: string) {
    super(`Invalid currency: ${currency}`);
    this.name = "InvalidCurrencyError";
  }
}

export class NoDataError extends Error {
  constructor(
    readonly from: string,
    readonly to: string,
    readonly date?: string
  ) {
    super(
      `No rate data available for ${from} to ${to}${date ? ` on ${date}` : ""}`
    );
    this.name = "NoDataError";
  }
}
```

- [ ] **Step 3: Create currency definitions**

Create `src/currencies.ts`:

```typescript
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
```

- [ ] **Step 4: Verify types compile**

Run: `deno check src/types.ts src/errors.ts src/currencies.ts`
Expected: No type errors

---

## Task 3: Cache Connector

**Files:**
- Create: `src/cache-connector.ts`
- Create: `tests/cache-connector.test.ts`

- [ ] **Step 1: Write failing tests for pure functions**

Create `tests/cache-connector.test.ts`:

```typescript
import { assertEquals } from "@std/assert";

// CacheConnector requires IndexedDB (browser-only), so we test with mock cache interface
// The actual IndexedDB persistence is tested via browser testing

// Mock cache for testing CurrencyService
class MockCache {
  private store = new Map<string, unknown>();

  async get<T>(key: string): Promise<T | null> {
    const value = this.store.get(key);
    return value !== undefined ? (value as T) : null;
  }

  async set(key: string, value: unknown): Promise<void> {
    this.store.set(key, value);
  }

  async has(key: string): Promise<boolean> {
    return this.store.has(key);
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  async clear(): Promise<void> {
    this.store.clear();
  }
}

Deno.test("MockCache: get returns null on cache miss", async () => {
  const cache = new MockCache();
  const result = await cache.get<number>("nonexistent");
  assertEquals(result, null);
});

Deno.test("MockCache: set and get roundtrip", async () => {
  const cache = new MockCache();
  await cache.set("rate:USD:SEK", 10.5);
  const result = await cache.get<number>("rate:USD:SEK");
  assertEquals(result, 10.5);
});

// CacheConnector browser tests are in tests/browser/
```

- [ ] **Step 2: Run tests to verify they pass**

Run: `deno test tests/cache-connector.test.ts`
Expected: PASS - MockCache tests run

- [ ] **Step 3: Implement CacheConnector**

Create `src/cache-connector.ts`:

```typescript
import type { CacheAdapter, SetOptions } from "@anabranch/cache";
import { Storage } from "@anabranch/storage";
import { createIndexedDB } from "@anabranch/storage-browser";

export class CacheConnector implements CacheAdapter {
  private storage: Awaited<ReturnType<typeof Storage.connect>> | null = null;
  private prefix: string;

  constructor(prefix: string = "currency-exchange:") {
    this.prefix = prefix;
  }

  private prefixedKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  async connect(): Promise<void> {
    this.storage = await Storage.connect(createIndexedDB({ prefix: this.prefix })).run();
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.storage) return null;
    try {
      const object = await this.storage.get(this.prefixedKey(key)).run();
      if (!object) return null;
      const text = await new Response(object.body).text();
      return JSON.parse(text) as T;
    } catch {
      return null;
    }
  }

  async set(key: string, value: unknown, options?: SetOptions): Promise<void> {
    if (!this.storage) return;
    try {
      const json = JSON.stringify(value);
      const blob = new Blob([json], { type: "application/json" });
      await this.storage.put(this.prefixedKey(key), blob, {
        contentType: "application/json",
      }).run();
    } catch {
      // Silently fail - cache transparently degrades
    }
  }

  async delete(key: string): Promise<void> {
    if (!this.storage) return;
    try {
      await this.storage.delete(this.prefixedKey(key)).run();
    } catch {
      // Silently fail
    }
  }

  async has(key: string): Promise<boolean> {
    if (!this.storage) return false;
    try {
      const metadata = await this.storage.head(this.prefixedKey(key)).run();
      return metadata !== null;
    } catch {
      return false;
    }
  }

  async clear(): Promise<void> {
    if (!this.storage) return;
    try {
      await this.storage.close().run();
      this.storage = null;
      await this.connect();
    } catch {
      // Silently fail
    }
  }

  async close(): Promise<void> {
    if (this.storage) {
      await this.storage.close().run();
      this.storage = null;
    }
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `deno test tests/cache-connector.test.ts`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/types.ts src/errors.ts src/currencies.ts src/cache-connector.ts tests/cache-connector.test.ts
git commit -m "feat: add core types, errors, and cache connector"
```

---

## Task 4: Currency Service

**Files:**
- Create: `src/currency-service.ts`
- Create: `tests/currency-service.test.ts`

- [ ] **Step 1: Write failing tests**

Create `tests/currency-service.test.ts`:

```typescript
import { assertEquals } from "@std/assert";
import { CurrencyService } from "../src/currency-service.ts";
import { isValidCurrency } from "../src/currencies.ts";

Deno.test("CurrencyService: buildCacheKey creates correct key for date-specific rate", () => {
  const key = CurrencyService.buildCacheKey("USD", "SEK", "2026-03-19");
  assertEquals(key, "currency:USD:SEK:2026-03-19");
});

Deno.test("CurrencyService: buildCacheKey creates correct key for latest rate", () => {
  const key = CurrencyService.buildCacheKey("USD", "SEK");
  assertEquals(key, "currency:USD:SEK:latest");
});

Deno.test("currencies: isValidCurrency returns false for unsupported currency", () => {
  assertEquals(isValidCurrency("XXX"), false);
});

Deno.test("currencies: isValidCurrency returns true for supported currencies", () => {
  assertEquals(isValidCurrency("USD"), true);
  assertEquals(isValidCurrency("SEK"), true);
  assertEquals(isValidCurrency("EUR"), true);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `deno test tests/currency-service.test.ts`
Expected: FAIL - CurrencyService not found

- [ ] **Step 3: Implement CurrencyService**

Create `src/currency-service.ts`:

```typescript
import type { Task } from "@anabranch/anabranch";
import { Task } from "@anabranch/anabranch";
import type { WebClient } from "@anabranch/web-client";
import type { CacheConnector } from "./cache-connector.ts";
import type { Rate, Currency, RateResponse, CachedRate } from "./types.ts";
import { InvalidCurrencyError, NetworkError, NoDataError } from "./errors.ts";
import { isValidCurrency } from "./currencies.ts";

export class CurrencyService {
  constructor(
    private cache: CacheConnector,
    private client: WebClient
  ) {}

  static buildCacheKey(from: Currency, to: Currency, date?: string): string {
    const datePart = date ?? "latest";
    return `currency:${from}:${to}:${datePart}`;
  }

  getRate(from: Currency, to: Currency, date?: string): Task<Rate, InvalidCurrencyError | NetworkError | NoDataError> {
    return Task.of(async () => {
      // Validate currencies
      if (!isValidCurrency(from)) {
        throw new InvalidCurrencyError(from);
      }
      if (!isValidCurrency(to)) {
        throw new InvalidCurrencyError(to);
      }

      const cacheKey = CurrencyService.buildCacheKey(from, to, date);

      // Try cache first
      const cached = await this.cache.get<CachedRate>(cacheKey);
      if (cached !== null) {
        return cached.rate;
      }

      // Fetch from API
      const datePath = date ?? "latest";
      const url = `/${datePath}?from=${from}&to=${to}`;

      try {
        const response = await this.client.get(url).run();
        const data: RateResponse = response.data;
        
        const rate = data.rates[to];
        if (rate === undefined) {
          throw new NoDataError(from, to, date);
        }

        // Cache for future use
        const ttl = date ? 86400000 : 3600000; // 24h for historical, 1h for latest
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
        return response.data.rates;
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `deno test tests/currency-service.test.ts`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/currency-service.ts tests/currency-service.test.ts
git commit -m "feat: add currency service with caching"
```

---

## Task 5: Design System CSS

**Files:**
- Create: `src/styles/design-system.css`

- [ ] **Step 1: Create design system styles**

Create `src/styles/design-system.css`:

```css
:root {
  /* Colors - Neon Cyberpunk */
  --color-bg-primary: #0a0a0f;
  --color-bg-secondary: #14141f;
  --color-bg-tertiary: #1a1a2e;
  --color-neon-cyan: #00fff9;
  --color-neon-pink: #ff00ff;
  --color-neon-yellow: #ffff00;
  --color-neon-green: #00ff00;
  --color-text-primary: #ffffff;
  --color-text-secondary: #b0b0b0;
  --color-border: #2a2a4a;
  --color-error: #ff3333;
  --color-warning: #ffaa00;

  /* Typography */
  --font-mono: "JetBrains Mono", "Space Mono", "Roboto Mono", monospace;
  --font-sans: "Inter", system-ui, sans-serif;

  /* Spacing */
  --spacing-xs: 0.5rem;
  --spacing-sm: 1rem;
  --spacing-md: 2rem;
  --spacing-lg: 3rem;
  --spacing-xl: 4rem;

  /* Transitions */
  --transition-fast: 150ms ease;
  --transition-normal: 300ms ease;
  --transition-slow: 500ms ease;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  font-size: 16px;
}

body {
  font-family: var(--font-sans);
  background-color: var(--color-bg-primary);
  color: var(--color-text-primary);
  min-height: 100vh;
  overflow-x: hidden;
}

/* Grid Background */
.grid-bg {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 0;
  background-image: 
    linear-gradient(var(--color-border) 1px, transparent 1px),
    linear-gradient(90deg, var(--color-border) 1px, transparent 1px);
  background-size: 50px 50px;
  opacity: 0.3;
  animation: grid-scroll 20s linear infinite;
}

@keyframes grid-scroll {
  0% { background-position: 0 0; }
  100% { background-position: 50px 50px; }
}

/* Scanlines Overlay */
.scanlines::before {
  content: "";
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 1000;
  background: repeating-linear-gradient(
    transparent,
    transparent 2px,
    rgba(0, 0, 0, 0.1) 2px,
    rgba(0, 0, 0, 0.1) 4px
  );
}

/* Neon Text */
.neon-text {
  color: var(--color-neon-cyan);
  text-shadow: 
    0 0 5px var(--color-neon-cyan),
    0 0 10px var(--color-neon-cyan),
    0 0 20px var(--color-neon-cyan);
}

.neon-text-pink {
  color: var(--color-neon-pink);
  text-shadow: 
    0 0 5px var(--color-neon-pink),
    0 0 10px var(--color-neon-pink),
    0 0 20px var(--color-neon-pink);
}

/* Neon Border */
.neon-border {
  border: 1px solid var(--color-neon-cyan);
  box-shadow: 
    0 0 5px var(--color-neon-cyan),
    inset 0 0 5px rgba(0, 255, 249, 0.1);
}

.neon-border-pink {
  border: 1px solid var(--color-neon-pink);
  box-shadow: 
    0 0 5px var(--color-neon-pink),
    inset 0 0 5px rgba(255, 0, 255, 0.1);
}

/* Animations */
@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes neon-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

@keyframes glow-pulse {
  0%, 100% { 
    box-shadow: 0 0 5px var(--color-neon-cyan), inset 0 0 5px rgba(0, 255, 249, 0.1);
  }
  50% { 
    box-shadow: 0 0 15px var(--color-neon-cyan), inset 0 0 10px rgba(0, 255, 249, 0.2);
  }
}

.animate-fade-in-up {
  animation: fade-in-up var(--transition-normal) forwards;
}

.animate-neon-pulse {
  animation: neon-pulse 2s ease-in-out infinite;
}

.animate-glow-pulse {
  animation: glow-pulse 2s ease-in-out infinite;
}

/* Layout */
.container {
  max-width: 600px;
  margin: 0 auto;
  padding: var(--spacing-md);
  position: relative;
  z-index: 1;
}

/* Typography */
h1, h2, h3 {
  font-family: var(--font-mono);
  font-weight: 700;
}

.rate-value {
  font-family: var(--font-mono);
  font-size: 3rem;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.05em;
}

/* Form Elements */
.input-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.input-label {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--color-text-secondary);
}

.select-wrapper {
  position: relative;
}

.currency-select {
  width: 100%;
  padding: var(--spacing-sm);
  font-family: var(--font-mono);
  font-size: 1rem;
  background: var(--color-bg-secondary);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
  cursor: pointer;
  appearance: none;
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
}

.currency-select:focus {
  outline: none;
  border-color: var(--color-neon-cyan);
  box-shadow: 0 0 10px var(--color-neon-cyan);
}

.currency-select option {
  background: var(--color-bg-secondary);
  color: var(--color-text-primary);
}

/* Buttons */
.btn {
  font-family: var(--font-mono);
  font-size: 1rem;
  padding: var(--spacing-sm) var(--spacing-md);
  background: transparent;
  color: var(--color-neon-cyan);
  border: 1px solid var(--color-neon-cyan);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn:hover {
  background: rgba(0, 255, 249, 0.1);
  box-shadow: 0 0 15px var(--color-neon-cyan);
}

.btn:active {
  transform: scale(0.98);
}

/* States */
.loading {
  opacity: 0.5;
  pointer-events: none;
}

.error {
  color: var(--color-error);
  border-color: var(--color-error);
  box-shadow: 0 0 10px var(--color-error);
}

.cached {
  position: relative;
}

.cached::after {
  content: "cached";
  position: absolute;
  top: -0.5rem;
  right: -0.5rem;
  font-size: 0.625rem;
  padding: 0.125rem 0.25rem;
  background: var(--color-warning);
  color: var(--color-bg-primary);
  border-radius: 2px;
}
```

- [ ] **Step 2: Verify CSS syntax**

Run: `deno run --allow-read --allow-write npm:lightningcss --minify src/styles/design-system.css`
Expected: No syntax errors

- [ ] **Step 3: Commit**

```bash
git add src/styles/design-system.css
git commit -m "feat: add Neon Cyberpunk design system"
```

---

## Task 6: UI Components (Islands)

**Files:**
- Create: `src/components/CurrencySelect.tsx`
- Create: `src/components/RateDisplay.tsx`
- Create: `src/components/CurrencyConverter.tsx`

- [ ] **Step 1: Create CurrencySelect component**

Create `src/components/CurrencySelect.tsx`:

```tsx
import type { Currency } from "../types.ts";
import { SUPPORTED_CURRENCIES, CURRENCY_NAMES, CURRENCY_SYMBOLS } from "../currencies.ts";

interface CurrencySelectProps {
  value: Currency;
  onChange: (value: Currency) => void;
  label?: string;
  id?: string;
}

export function CurrencySelect({ value, onChange, label, id }: CurrencySelectProps) {
  return (
    <div className="input-group">
      {label && <label htmlFor={id} className="input-label">{label}</label>}
      <div className="select-wrapper">
        <select
          id={id}
          className="currency-select neon-border"
          value={value}
          onChange={(e) => onChange(e.target.value as Currency)}
        >
          {SUPPORTED_CURRENCIES.map((currency) => (
            <option key={currency} value={currency}>
              {CURRENCY_SYMBOLS[currency]} {currency} - {CURRENCY_NAMES[currency]}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create RateDisplay component**

Create `src/components/RateDisplay.tsx`:

```tsx
import type { Rate } from "../types.ts";
import { CURRENCY_SYMBOLS } from "../currencies.ts";

interface RateDisplayProps {
  rate: Rate | null;
  fromCurrency: string;
  toCurrency: string;
  loading?: boolean;
  cached?: boolean;
}

export function RateDisplay({ rate, fromCurrency, toCurrency, loading, cached }: RateDisplayProps) {
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
        <div className="rate-value" style={{ color: "var(--color-text-secondary)" }}>
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
      <div className="rate-label neon-text-pink" style={{ fontSize: "0.875rem", marginTop: "0.5rem" }}>
        {CURRENCY_SYMBOLS[fromCurrency as keyof typeof CURRENCY_SYMBOLS]} 1 {fromCurrency} = {" "}
        {CURRENCY_SYMBOLS[toCurrency as keyof typeof CURRENCY_SYMBOLS]} {rate.toFixed(4)} {toCurrency}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create CurrencyConverter Island**

Create `src/components/CurrencyConverter.tsx`:

```tsx
import { useState, useEffect } from "npm:react";
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
      
      if (result.ok) {
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
```

- [ ] **Step 4: Verify components compile**

Run: `deno check src/components/*.tsx`
Expected: No type errors

- [ ] **Step 5: Commit**

```bash
git add src/components/*.tsx
git commit -m "feat: add Island components for currency converter"
```

---

## Task 7: Layout and Main Page

**Files:**
- Create: `_includes/layout.tsx`
- Modify: `index.tsx`

- [ ] **Step 1: Create base layout**

Create `_includes/layout.tsx`:

```tsx
import type { Page } from "lume/core/file.ts";

interface LayoutProps {
  title: string;
  children: React.ReactNode;
}

export default function Layout({ title, children }: LayoutProps) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="/styles/design-system.css" />
      </head>
      <body className="scanlines">
        <div className="grid-bg" />
        <main className="container">
          {children}
        </main>
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Create main page**

Update `index.tsx`:

```tsx
import Layout from "./_includes/layout.tsx";
import { CurrencyConverter } from "./src/components/CurrencyConverter.tsx";

export const title = "Currency Exchange";

export default function IndexPage() {
  return (
    <Layout title="Currency Exchange">
      <header style={{ marginBottom: "var(--spacing-lg)" }}>
        <h1 className="neon-text" style={{ fontSize: "2.5rem", textAlign: "center" }}>
          CURRENCY EXCHANGE
        </h1>
        <p className="neon-text-pink" style={{ textAlign: "center", marginTop: "var(--spacing-sm)", fontFamily: "var(--font-mono)", fontSize: "0.875rem" }}>
          Real-time rates powered by Frankfurter API
        </p>
      </header>
      
      <CurrencyConverter />
    </Layout>
  );
}
```

- [ ] **Step 3: Update Lume config for JSX islands**

Update `_config.ts`:

```typescript
import lume from "lume/mod.ts";
import jsx from "lume/plugins/jsx.ts";
import esbuild from "lume/plugins/esbuild.ts";
import lightningcss from "lume/plugins/lightningcss.ts";

const site = lume({
  src: "./",
  dest: "./_site",
});

site.use(jsx({
  jsxImportSource: "npm:react",
}));

site.use(esbuild({
  extensions: [".ts", ".tsx"],
  options: {
    jsx: "automatic",
    jsxImportSource: "npm:react",
    bundle: true,
  },
}));

site.use(lightningcss());

site.copy("src/styles");

export default site;
```

- [ ] **Step 4: Build and test**

Run: `deno task build`
Expected: Site builds to `_site/`

- [ ] **Step 5: Test dev server**

Run: `deno task dev`
Expected: Dev server starts, page loads at localhost:3000

- [ ] **Step 6: Commit**

```bash
git add _includes/layout.tsx index.tsx _config.ts
git commit -m "feat: add layout and main page"
```

---

## Task 8: Final Testing and Polish

**Files:**
- Modify: All files as needed

- [ ] **Step 1: Run all tests**

Run: `deno test`
Expected: All tests PASS

- [ ] **Step 2: Test in browser manually**

- Open `http://localhost:3000`
- Verify grid background animates
- Select different currencies
- Verify rate updates
- Check console for errors

- [ ] **Step 3: Test offline behavior**

- Open browser dev tools, network tab
- Select currencies, verify rate loads
- Enable offline mode
- Select same currencies again
- Verify cached rate displays

- [ ] **Step 4: Lint and format**

Run: `deno fmt` && `deno lint`
Expected: No errors

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "chore: final polish and testing"
```

---

## Summary

This plan creates a Lume-based static site with:
- Browser-layer services using anabranch packages for caching (IndexedDB) and HTTP
- Islands architecture for interactive components
- Neon Cyberpunk design system
- Currency conversion between USD, EUR, GBP, JPY, CHF, SEK
- Full TDD coverage for core services

Each task produces working, testable software. Follow TDD: write failing tests first, then implement.