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
