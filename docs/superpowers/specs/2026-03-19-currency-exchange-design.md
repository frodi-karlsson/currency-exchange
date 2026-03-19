# Currency Exchange App Design

Date: 2026-03-19

## Overview

A Lume-based static site with Islands architecture that displays currency exchange rates. Features a Neon Cyberpunk aesthetic with brutalist design elements, neon accents, animated grids, and high contrast.

## Supported Currencies

USD, EUR, GBP, JPY, CHF, SEK

## Architecture

### Core Layers

**Browser Layer** - Runs in browser after initial page load:
- `CacheConnector`: Implements `CacheAdapter` interface wrapping `storage-browser`'s IndexedDB connector
- `CurrencyService`: Uses `WebClient` to fetch rates from Frankfurter API, caches via CacheConnector
- **Islands**: Interactive components that hydrate on the client

**Build Layer** - Runs during Lume build:
- Lume configuration with plugins (lightningcss, esbuild)
- TypeScript compilation to browser-ready JS
- Static HTML generation

### Dependency Flow

```
Page (static HTML)
  → Islands (hydrate on load)
    → CurrencyService
      → WebClient (API calls)
      → CacheConnector
        → storage-browser (IndexedDB)
```

### Dependencies

All `@anabranch/*` packages are external dependencies from the anabranch library:
- `@anabranch/cache` - Cache abstraction with Task semantics
- `@anabranch/storage-browser` - IndexedDB adapter
- `@anabranch/web-client` - HTTP client with retries/timeouts
- `@anabranch/storage` - Core Storage interface (dependency of storage-browser)
- `@anabranch/anabranch` - Core library providing `Task` type

## Component Structure

### Types

**Core Types:**
```typescript
import { Task } from "@anabranch/anabranch";

type Rate = number;
type Currency = "USD" | "EUR" | "GBP" | "JPY" | "CHF" | "SEK";

interface RateResponse {
  base: Currency;
  date: string;
  rates: Record<Currency, Rate>;
}
```

### Pages

- `index.tsx` - Main exchange converter page (Island component)

### Core Services

**`src/cache-connector.ts`** - Implements `CacheAdapter` using `storage-browser`:
- Methods: `get`, `set`, `delete`, `has`, `clear`
- Key format: `currency:{from}:{to}:{date}`
- Returns `T | null` on cache miss/failure (transparent degradation)

**`src/currency-service.ts`** - Currency conversion logic:
- `getRate(from: Currency, to: Currency, date?: Date): Task<Rate, NetworkError | InvalidCurrencyError>`
- Uses WebClient internally with retries

**`src/currencies.ts`** - Currency definitions:
- `SUPPORTED_CURRENCIES`: USD, EUR, GBP, JPY, CHF, SEK
- Currency type, display names, symbols

### UI Components

- `src/components/CurrencyConverter.tsx` - Main converter interface
- `src/components/CurrencySelect.tsx` - Dropdown for currency selection
- `src/components/RateDisplay.tsx` - Shows current rate with animation

### Styles

- `src/styles/design-system.css` - CSS custom properties, animations, utilities
- `src/styles/components/` - Component-specific styles

### Lume Config

- `_config.ts` - Site configuration with plugins
- `src/` - TypeScript source files (compiled by esbuild)

## Data Flow

### Rate Fetching Flow

```
User selects currencies
  → CurrencyConverter.getRate(from, to, date?)
    → CurrencyService.getRate(from, to, date)
      → Build cache key: "currency:{from}:{to}:{date}"
      → Cache.get(key)
        → HIT: Return cached rate immediately
        → MISS: Continue to API
      → WebClient.get(`https://api.frankfurter.app/{date}/{from}?to={to}`)
        → Parse response: { rates: { SEK: 10.5 }}
        → Cache.set(key, rate, { ttl: 86400000 }) // 24h TTL for historical
        → Return rate
      → UI animates in new rate
```

### Cache Key Strategy

- Date-specific rates: `currency:USD:SEK:2026-03-19` (TTL: 24h - historical rates don't change)
- Latest rates: `currency:USD:SEK:latest` (TTL: 1h - rates update frequently)

### API Response Handling

```typescript
// Frankfurter API returns:
{ base: "USD", date: "2026-03-19", rates: { EUR: 0.92, SEK: 10.5 }}

// CurrencyService extracts and stores individual rates:
// currency:USD:EUR:2026-03-19 → 0.92
// currency:USD:SEK:2026-03-19 → 10.5
```

## Design System (Neon Cyberpunk)

### Color Palette

```css
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
```

### Typography

- Headlines: `Space Mono` or `JetBrains Mono` (monospace, techy)
- Body: `Inter` or `Roboto Mono` (readable, modern)
- Large numbers with `font-variant-numeric: tabular-nums`

### Visual Effects

- **Glow Effects**: `text-shadow: 0 0 10px var(--color-neon-cyan);`
- **Neon Borders**: Thin 1-2px borders with glow: `box-shadow: 0 0 5px var(--color-neon-pink), inset 0 0 5px var(--color-neon-pink);`
- **Grid Background**: Animated diagonal grid lines with `background-image` pattern
- **Scanlines**: Subtle CRT-style scanlines via pseudo-element overlay

### Animations

```css
/* Rate update animation */
@keyframes rate-update {
  0% { opacity: 0; transform: translateY(-10px); }
  100% { opacity: 1; transform: translateY(0); }
}

/* Neon pulse */
@keyframes neon-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

/* Grid scroll */
@keyframes grid-scroll {
  0% { background-position: 0 0; }
  100% { background-position: 50px 50px; }
}
```

### Component Styles

- **Inputs**: Dark background, neon border on focus, glowing placeholder text
- **Dropdowns**: Custom styled with neon accents, dark dropdown menu
- **Rate Display**: Large monospace numbers, cyan/green color, pulsing glow on update
- **Buttons**: Neon border with hover glow effect, minimal background

### Layout

- Centered vertical flow, brutalist spacing
- Wide margins, generous whitespace
- Single column on mobile, max-width 600px

## Error Handling

### Error Classes

```typescript
class NetworkError extends Error {
  readonly retryable = true;
  constructor(message: string) {
    super(message);
    this.name = "NetworkError";
  }
}

class CacheError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CacheError";
  }
}

class InvalidCurrencyError extends Error {
  constructor(readonly currency: string) {
    super(`Invalid currency: ${currency}`);
    this.name = "InvalidCurrencyError";
  }
}
```

### Layered Error Handling

**1. CacheConnector** - Returns `T | null`:
- Cache transparently degrades
- Miss or failure returns null
- Never throws

**2. CurrencyService** - Propagates errors:
```typescript
getRate(from: Currency, to: Currency): Task<Rate, NetworkError | InvalidCurrencyError> {
  return this.fetchRate(from, to)
    .recoverWhen(
      (err): err is NetworkError => err instanceof NetworkError,
      async () => {
        const cached = await this.cache.get(`currency:${from}:${to}:stale`);
        if (!cached) throw err;
        return cached;
      }
    );
}
```

**3. Consumer** - Chooses handling:
```typescript
// Throw on error:
const rate = await currencyService.getRate("USD", "SEK").run();

// Or handle manually:
const result = await currencyService.getRate("USD", "SEK").result();
if (result.ok) console.log(result.value);
else console.error(result.error);
```

### UI Feedback

- Loading states: Skeleton screens with animated grid background
- Errors: Red neon glow, inline error message
- Cached data: Yellow badge when using stale cache
- No data: Grayed out display

## Testing Strategy

### Unit Tests (Deno test runner)

**CacheConnector Tests:**
- `get` returns null on cache miss
- `set` + `get` roundtrip works
- Handles IndexedDB failures gracefully (returns null)

**CurrencyService Tests:**
- `getRate` returns cached value on HIT
- `getRate` fetches from API on cache miss
- `getRate` returns stale cache on NetworkError
- `getRate` propagates InvalidCurrencyError
- WebClient retry behavior (mock API failures)

**Cache Key Generation:**
- Date-specific keys: `currency:USD:SEK:2026-03-19`
- Latest keys: `currency:USD:SEK:latest`

### Test Utilities

```typescript
// Mock cache adapter for testing
const mockCache = createInMemory();

// Mock WebClient responses
const mockClient = WebClient.create().withBaseUrl("...");
```

### Test Commands

```bash
deno test src/               # Run all tests
deno test src/cache/         # Run cache tests only
deno test --coverage         # With coverage
```

### Browser Testing

- Manual testing in browser for UI/animations
- Test cache persistence across page refreshes
- Test offline behavior