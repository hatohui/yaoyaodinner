import Redis from "ioredis";

let _client: Redis | null = null;
let _isAvailable = false;
let _initialized = false;
const _fallbackCache = new Map<string, { value: unknown; expiresAt: number }>();

async function initializeClient(): Promise<void> {
  if (_initialized) return;
  _initialized = true;

  const url = process.env.REDIS_URL;
  if (!url) {
    console.warn("[Redis] REDIS_URL not set, using fallback cache");
    _isAvailable = false;
    return;
  }

  const client = new Redis(url, {
    retryStrategy: () => null,
    maxRetriesPerRequest: 1,
    enableReadyCheck: false,
    enableOfflineQueue: false,
    // Connect explicitly below: with the offline queue off, a command sent before
    // the (TLS) handshake finishes fails with "Stream isn't writeable".
    lazyConnect: true,
  });

  try {
    client.on("error", (err: Error) => {
      console.warn("[Redis] Connection error:", err.message);
      _isAvailable = false;
    });

    client.on("connect", () => {
      _isAvailable = true;
      console.log("[Redis] Connected successfully");
    });

    await client.connect();
    await client.ping();
    _isAvailable = true;
    _client = client;
  } catch (err) {
    console.warn(
      "[Redis] Failed to connect:",
      err instanceof Error ? err.message : String(err)
    );
    _isAvailable = false;
    _client = null;
    client.disconnect();
  }
}

function getFallbackCache<T>(key: string): T | null {
  const cached = _fallbackCache.get(key);
  if (!cached) return null;
  if (cached.expiresAt < Date.now()) {
    _fallbackCache.delete(key);
    return null;
  }
  return cached.value as T;
}

function setFallbackCache(key: string, value: unknown, ttl?: number): void {
  _fallbackCache.set(key, {
    value,
    expiresAt: ttl ? Date.now() + ttl * 1000 : Infinity,
  });
}

export const CacheService = {
  async get<T>(key: string): Promise<T | null> {
    try {
      await initializeClient();

      if (_client && _isAvailable) {
        try {
          const result = await _client.get(key);
          return result ? JSON.parse(result) : null;
        } catch (err) {
          console.warn(
            "[Redis] Get operation failed:",
            err instanceof Error ? err.message : String(err)
          );
          return getFallbackCache<T>(key);
        }
      }
    } catch (err) {
      console.warn(
        "[Redis] Initialization failed:",
        err instanceof Error ? err.message : String(err)
      );
    }

    return getFallbackCache<T>(key);
  },

  async set(key: string, value: unknown, ttl?: number): Promise<string | null> {
    try {
      await initializeClient();

      if (_client && _isAvailable) {
        try {
          return ttl
            ? await _client.set(key, JSON.stringify(value), "EX", ttl)
            : await _client.set(key, JSON.stringify(value));
        } catch (err) {
          console.warn(
            "[Redis] Set operation failed:",
            err instanceof Error ? err.message : String(err)
          );
          setFallbackCache(key, value, ttl);
          return null;
        }
      }
    } catch (err) {
      console.warn(
        "[Redis] Initialization failed:",
        err instanceof Error ? err.message : String(err)
      );
    }

    setFallbackCache(key, value, ttl);
    return null;
  },

  async delete(key: string): Promise<void> {
    try {
      await initializeClient();

      if (_client && _isAvailable) {
        try {
          await _client.del(key);
        } catch (err) {
          console.warn(
            "[Redis] Delete operation failed:",
            err instanceof Error ? err.message : String(err)
          );
        }
      }
    } catch (err) {
      console.warn(
        "[Redis] Initialization failed:",
        err instanceof Error ? err.message : String(err)
      );
    }

    _fallbackCache.delete(key);
  },

  async deleteByPrefix(prefix: string): Promise<void> {
    try {
      await initializeClient();

      if (_client && _isAvailable) {
        try {
          let cursor = "0";
          do {
            const [next, keys] = await _client.scan(
              cursor,
              "MATCH",
              `${prefix}*`,
              "COUNT",
              100
            );
            cursor = next;
            if (keys.length > 0) await _client.del(...keys);
          } while (cursor !== "0");
        } catch (err) {
          console.warn(
            "[Redis] Delete-by-prefix failed:",
            err instanceof Error ? err.message : String(err)
          );
        }
      }
    } catch (err) {
      console.warn(
        "[Redis] Initialization failed:",
        err instanceof Error ? err.message : String(err)
      );
    }

    for (const key of _fallbackCache.keys()) {
      if (key.startsWith(prefix)) _fallbackCache.delete(key);
    }
  },

  async ping(): Promise<string> {
    try {
      await initializeClient();

      if (_client && _isAvailable) {
        try {
          return await _client.ping();
        } catch (err) {
          console.warn(
            "[Redis] Ping operation failed:",
            err instanceof Error ? err.message : String(err)
          );
          return "FALLBACK";
        }
      }
    } catch (err) {
      console.warn(
        "[Redis] Initialization failed:",
        err instanceof Error ? err.message : String(err)
      );
    }

    return "FALLBACK";
  },

  isAvailable(): boolean {
    return _isAvailable;
  },
};
