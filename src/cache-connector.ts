import type { CacheAdapter, SetOptions } from "@anabranch/cache";
import { Storage } from "@anabranch/storage";
import { createIndexedDB } from "@anabranch/storage-browser";

export class CacheConnector implements CacheAdapter {
  private storage: Storage | null = null;
  private prefix: string;

  constructor(prefix: string = "currency-exchange:") {
    this.prefix = prefix;
  }

  private prefixedKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  async connect(): Promise<void> {
    this.storage = await Storage.connect(
      createIndexedDB({ prefix: this.prefix }),
    ).run();
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

  async set(key: string, value: unknown, _options?: SetOptions): Promise<void> {
    if (!this.storage) return;
    try {
      const json = JSON.stringify(value);
      await this.storage.put(this.prefixedKey(key), json, {
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
