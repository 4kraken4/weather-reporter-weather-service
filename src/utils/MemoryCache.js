/**
 * Simple in-memory cache with TTL support
 */
export class MemoryCache {
  constructor() {
    this.cache = new Map();
    this.timers = new Map();
  }

  /**
   * Set a value in cache with TTL
   */
  set(key, value, ttlMs = 300000) {
    // Default 5 minutes
    // Clear existing timer if any
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
    }

    // Store the value
    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });

    // Set expiration timer
    const timer = setTimeout(() => {
      this.delete(key);
    }, ttlMs);

    this.timers.set(key, timer);
  }

  /**
   * Get a value from cache
   */
  get(key) {
    const cached = this.cache.get(key);
    return cached ? cached.value : null;
  }

  /**
   * Check if key exists and is not expired
   */
  has(key) {
    return this.cache.has(key);
  }

  /**
   * Delete a key from cache
   */
  delete(key) {
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
      this.timers.delete(key);
    }
    return this.cache.delete(key);
  }

  /**
   * Clear all cache
   */
  clear() {
    // Clear all timers
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.timers.clear();
    this.cache.clear();
  }

  /**
   * Get cache size
   */
  size() {
    return this.cache.size;
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      timestamps: Array.from(this.cache.values()).map(entry => ({
        timestamp: entry.timestamp,
        age: Date.now() - entry.timestamp
      }))
    };
  }
}

// Create a global cache instance
export const globalWeatherCache = new MemoryCache();
