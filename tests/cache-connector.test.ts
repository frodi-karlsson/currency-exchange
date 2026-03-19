import { assertEquals } from "@std/assert";

// CacheConnector requires IndexedDB (browser-only), so we test with mock cache interface
// The actual IndexedDB persistence is tested via browser testing

// Mock cache for testing CurrencyService
class MockCache {
  private store = new Map<string, unknown>();

  get<T>(key: string): Promise<T | null> {
    const value = this.store.get(key);
    return Promise.resolve(value !== undefined ? (value as T) : null);
  }

  set(key: string, value: unknown): Promise<void> {
    this.store.set(key, value);
    return Promise.resolve();
  }

  has(key: string): Promise<boolean> {
    return Promise.resolve(this.store.has(key));
  }

  delete(key: string): Promise<void> {
    this.store.delete(key);
    return Promise.resolve();
  }

  clear(): Promise<void> {
    this.store.clear();
    return Promise.resolve();
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
