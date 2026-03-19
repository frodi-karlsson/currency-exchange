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