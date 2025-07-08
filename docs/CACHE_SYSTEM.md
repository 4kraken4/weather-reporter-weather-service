# Cache System Documentation

This project supports two types of caching: **In-Memory Cache** and **Redis Cache**. You can configure which cache strategy to use through environment variables.

## Configuration

### Environment Variables

Create environment-specific `.env` files in the `src/` directory with the following variables:

```bash
# Cache Strategy Configuration
CACHE_STRATEGY=memory          # Options: 'memory' or 'redis'
CACHE_DEFAULT_TTL=300000       # Default TTL in milliseconds (5 minutes)

# Redis Configuration (only required when CACHE_STRATEGY=redis)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=                # Leave empty if no password
REDIS_DATABASE=0
REDIS_KEY_PREFIX=weather:
REDIS_RETRY_DELAY=100
REDIS_ENABLE_READY_CHECK=true
REDIS_MAX_RETRIES=3
```

**File Locations:**

- Development: `src/.env.development`
- Production: `src/.env.production`
- Testing: Automatically configured for tests

### Cache Strategies

#### 1. Memory Cache (Default)

- **Pros**: Fast, no external dependencies, simple setup
- **Cons**: Data lost on application restart, not shared between instances
- **Use case**: Development, single-instance deployments, temporary caching

#### 2. Redis Cache

- **Pros**: Persistent, shared between instances, scalable, advanced features
- **Cons**: Requires Redis server, network latency, additional complexity
- **Use case**: Production, multi-instance deployments, persistent caching

## Usage

### Basic Usage with Cache Factory

```javascript
import { getUnifiedCache } from './utils/CacheFactory.js';

// Get cache instance (automatically chooses Redis or Memory based on config)
const cache = await getUnifiedCache();

// Set a value with default TTL (5 minutes)
await cache.set('weather:london-gb', weatherData);

// Set a value with custom TTL (in milliseconds)
await cache.set('weather:paris-fr', weatherData, 600000); // 10 minutes

// Get a value
const cachedData = await cache.get('weather:london-gb');

// Check if key exists
const exists = await cache.has('weather:london-gb');

// Delete a key
await cache.delete('weather:london-gb');

// Clear all cache
await cache.clear();

// Get cache statistics
const stats = await cache.getStats();
console.log(`Cache size: ${stats.size}, Connected: ${stats.connected || 'N/A'}`);
```

### Alternative: Direct Cache Factory Usage

```javascript
import { CacheFactory } from './utils/CacheFactory.js';

// Get cache instance directly
const cache = await CacheFactory.getInstance();

// Get cache configuration info
const info = CacheFactory.getCacheInfo();
console.log(`Using ${info.strategy} cache with ${info.defaultTtl}ms TTL`);

// Create specific cache instance for testing
const memoryCache = CacheFactory.createInstance('memory');
const redisCache = CacheFactory.createInstance('redis');
```

### Usage in Use Cases

```javascript
import { getUnifiedCache } from '../../utils/CacheFactory.js';
import Config from '../../config/Config.js';

export default class GetCurrentWeatherForRegionWithCache {
  constructor(weatherRepository) {
    this.weatherRepository = weatherRepository;
    this.config = Config.getInstance();
  }

  async execute(regionId) {
    const cacheKey = `current_weather:${regionId}`;

    try {
      // Get unified cache instance (works with both Redis and Memory cache)
      const cache = await getUnifiedCache();

      // Try to get from cache first
      const cachedData = await cache.get(cacheKey);
      if (cachedData) {
        return {
          success: true,
          data: cachedData,
          source: 'cache'
        };
      }

      // Fetch from API if not cached
      const weatherData = await this.fetchFromAPI(regionId);

      // Cache the result with default TTL
      await cache.set(cacheKey, weatherData, this.config.cache.defaultTtl);

      return {
        success: true,
        data: weatherData,
        source: 'api'
      };
    } catch (error) {
      console.error('Cache operation failed:', error);
      // Fallback to API call without cache
      const weatherData = await this.fetchFromAPI(regionId);
      return {
        success: true,
        data: weatherData,
        source: 'api'
      };
    }
  }

  async fetchFromAPI(regionId) {
    // Implementation for API call
    const response = await OpenWeather.getCurrentWeather(regionId);
    return Weather.fromJson(response.data);
  }
}
```

### Direct Cache Usage

If you need to use a specific cache implementation directly:

```javascript
import { MemoryCache, globalWeatherCache } from './utils/MemoryCache.js';
import { RedisCache, globalRedisCache } from './utils/RedisCache.js';

// Memory Cache (synchronous operations)
const memoryCache = new MemoryCache();
memoryCache.set('key', 'value', 300000);
const value = memoryCache.get('key');

// Or use global instance
globalWeatherCache.set('weather:london', weatherData, 300000);

// Redis Cache (asynchronous operations)
const redisCache = new RedisCache();
await redisCache.connect();
await redisCache.set('key', 'value', 300000);
const value = await redisCache.get('key');

// Or use global instance
await globalRedisCache.connect();
await globalRedisCache.set('weather:london', weatherData, 300000);
```

## API Reference

### CacheFactory

#### Static Methods

- `getInstance()`: Returns the configured cache instance (Redis or Memory) as a singleton
- `createInstance(strategy?)`: Creates a new cache instance with optional strategy override
- `reset()`: Resets the singleton instance (useful for testing)
- `getCacheInfo()`: Returns cache configuration information

```javascript
// Get singleton cache instance
const cache = await CacheFactory.getInstance();

// Create specific cache type
const memoryCache = CacheFactory.createInstance('memory');
const redisCache = CacheFactory.createInstance('redis');

// Get configuration info
const info = CacheFactory.getCacheInfo();
// Returns: { strategy: 'redis', defaultTtl: 300000, isRedis: true, isMemory: false }

// Reset for testing
CacheFactory.reset();
```

### UnifiedCache

Provides a consistent async interface for both cache types. All operations are async for compatibility:

#### Methods

- `set(key, value, ttlMs?)`: Set a value with optional TTL (defaults to 5 minutes)
- `get(key)`: Get a value by key (returns null if not found)
- `has(key)`: Check if key exists (returns boolean)
- `delete(key)`: Delete a key (returns boolean for success)
- `clear()`: Clear all cache
- `size()`: Get cache size (number of keys)
- `getStats()`: Get detailed cache statistics

```javascript
const cache = await getUnifiedCache();

// All operations are async
await cache.set('user:123', userData, 600000);
const user = await cache.get('user:123');
const exists = await cache.has('user:123');
const deleted = await cache.delete('user:123');
const size = await cache.size();
const stats = await cache.getStats();
```

### MemoryCache

In-memory cache implementation with TTL support and automatic cleanup:

#### Methods

- `set(key, value, ttlMs?)`: Set a value (sync) - defaults to 5 minutes TTL
- `get(key)`: Get a value (sync) - returns null if not found or expired
- `has(key)`: Check if key exists (sync) - returns boolean
- `delete(key)`: Delete a key (sync) - returns boolean, cleans up timers
- `clear()`: Clear all cache (sync) - cleans up all timers
- `size()`: Get cache size (sync) - returns number of active keys
- `getStats()`: Get cache statistics (sync) - includes timestamps and ages

**Features:**

- Automatic TTL expiration with setTimeout cleanup
- Memory-efficient timer management
- Detailed statistics with key ages
- Global singleton instance available (`globalWeatherCache`)

```javascript
import { MemoryCache, globalWeatherCache } from './utils/MemoryCache.js';

const cache = new MemoryCache();
cache.set('weather:london', data, 300000); // 5 minutes
const data = cache.get('weather:london');

// Global instance usage
globalWeatherCache.set('global:key', data);
```

### RedisCache

Redis-based cache implementation with connection management and error handling:

#### Methods

- `connect()`: Initialize Redis connection (async) - must be called before use
- `set(key, value, ttlMs?)`: Set a value (async) - defaults to 5 minutes TTL
- `get(key)`: Get a value (async) - returns null if not found
- `has(key)`: Check if key exists (async) - returns boolean
- `delete(key)`: Delete a key (async) - returns boolean for success
- `clear()`: Clear all cache with prefix (async) - removes only keys with configured prefix
- `size()`: Get cache size (async) - counts keys with prefix
- `getStats()`: Get detailed cache statistics (async) - includes connection status
- `disconnect()`: Close Redis connection (async)

**Features:**

- Automatic connection management with reconnection
- Key prefix support for namespace isolation
- JSON serialization with timestamp tracking
- Comprehensive error handling and logging
- Connection status monitoring
- Global singleton instance available (`globalRedisCache`)

```javascript
import { RedisCache, globalRedisCache } from './utils/RedisCache.js';

// New instance
const cache = new RedisCache();
await cache.connect();
await cache.set('weather:london', data, 300000);

// Global instance usage
await globalRedisCache.connect();
await globalRedisCache.set('global:key', data);

// Connection status
console.log('Connected:', cache.isConnected);
```

## Installation

### Redis Setup

#### Option 1: Docker (Recommended)

```bash
# Run Redis in Docker
docker run -d --name redis-cache -p 6379:6379 redis:latest

# With password
docker run -d --name redis-cache -p 6379:6379 redis:latest redis-server --requirepass yourpassword
```

#### Option 2: Local Installation

**Ubuntu/Debian:**

```bash
sudo apt update
sudo apt install redis-server
sudo systemctl start redis-server
```

**macOS:**

```bash
brew install redis
brew services start redis
```

**Windows:**

```bash
# Using WSL or download from Redis website
```

### Package Installation

The required Redis package is already included in dependencies:

```json
{
  "dependencies": {
    "ioredis": "^5.6.1"
  }
}
```

**Installation:**

```bash
npm install  # ioredis already included
```

**Key Dependencies:**

- `ioredis`: Modern Redis client with full feature support
- Built-in `Map` and `setTimeout` for MemoryCache (no additional dependencies)

## Environment-Specific Configuration

### Development (.env.development)

```bash
CACHE_STRATEGY=memory
CACHE_DEFAULT_TTL=300000

# Redis not required for development
```

### Production (.env.production)

```bash
CACHE_STRATEGY=redis
CACHE_DEFAULT_TTL=1800000
REDIS_HOST=your-redis-host.com
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
REDIS_DATABASE=0
REDIS_KEY_PREFIX=weather:prod:
REDIS_RETRY_DELAY=100
REDIS_ENABLE_READY_CHECK=true
REDIS_MAX_RETRIES=3
```

### Testing Environment

Tests automatically use memory cache regardless of configuration for speed and isolation:

```javascript
// Test setup automatically handled
process.env.NODE_ENV = 'test';
// Cache factory will use memory cache for tests
```

## Testing

Run the cache-related tests:

```bash
# Memory cache tests
npm test -- --testPathPattern=MemoryCache

# Cache factory tests
npm test -- --testPathPattern=CacheFactory

# Use case tests with caching
npm test -- --testPathPattern=GetCurrentWeatherForRegionWithCache

# Bulk weather tests (uses caching)
npm test -- --testPathPattern=GetBulkWeatherData

# All cache-related tests
npm test -- --testNamePattern="cache|Cache"
```

The test suite covers:

- **Memory cache functionality**: TTL, expiration, statistics
- **Cache factory behavior**: Strategy selection, fallback
- **Unified cache interface**: Consistent async operations
- **TTL expiration**: Automatic cleanup and timer management
- **Error handling**: Redis connection failures, graceful degradation
- **Integration tests**: Real use case scenarios with caching

## Best Practices

1. **Key Naming**: Use consistent, descriptive key patterns with prefixes:

   ```javascript
   // Good - Use descriptive patterns
   const key = `weather:current:${regionId}`;
   const key = `weather:bulk:${cityName}-${country}`;
   const key = `regions:search:${searchTerm}`;

   // Avoid - Ambiguous or random keys
   const key = regionId;
   const key = `data_${Math.random()}`;
   ```

2. **TTL Management**: Set appropriate TTLs based on data freshness requirements:

   ```javascript
   // Weather data - 5 minutes
   await cache.set(key, data, 300000);

   // User preferences - 1 hour
   await cache.set(key, data, 3600000);

   // Static data - 24 hours
   await cache.set(key, data, 86400000);
   ```

3. **Error Handling**: Always handle cache failures gracefully with fallback:

   ```javascript
   async function getWeatherWithCache(regionId) {
     try {
       const cache = await getUnifiedCache();
       const cached = await cache.get(`weather:${regionId}`);
       if (cached) return cached;
     } catch (error) {
       console.warn('Cache error, falling back to data source:', error);
       // Continue to fallback - don't throw
     }

     // Fallback to primary data source
     return await fetchFromWeatherAPI(regionId);
   }
   ```

4. **Cache Invalidation**: Implement cache invalidation strategies for data updates:

   ```javascript
   // Clear specific cache on data update
   await cache.delete(`weather:current:${regionId}`);

   // Clear related caches for bulk operations
   await cache.delete(`weather:bulk:${cityName}-${country}`);

   // Clear all weather cache for region
   const keys = await cache.getStats();
   const weatherKeys = keys.keys.filter(key => key.includes(`weather:${regionId}`));
   await Promise.all(weatherKeys.map(key => cache.delete(key)));
   ```

5. **Connection Management**: Properly manage Redis connections:

   ```javascript
   // Good - Use global instance or proper lifecycle
   const cache = await getUnifiedCache(); // Uses singleton

   // Or handle connection lifecycle explicitly
   const redisCache = new RedisCache();
   await redisCache.connect();
   try {
     await redisCache.set('key', 'value');
   } finally {
     await redisCache.disconnect(); // Clean up
   }
   ```

6. **Performance Considerations**: Monitor cache performance and adjust settings:

   ```javascript
   // Monitor cache hit rates
   const stats = await cache.getStats();
   console.log(
     `Cache performance: ${stats.size} keys, ${stats.connected ? 'connected' : 'disconnected'}`
   );

   // Use appropriate TTL based on data characteristics
   await cache.set('static:config', data, 86400000); // 24 hours
   await cache.set('weather:current', data, 300000); // 5 minutes
   await cache.set('user:session', data, 3600000); // 1 hour
   ```

## Monitoring and Debugging

### Cache Statistics

```javascript
const cache = await getUnifiedCache();
const stats = await cache.getStats();

console.log('Cache Statistics:', {
  size: stats.size,
  keys: stats.keys.slice(0, 10), // Show first 10 keys
  connected: stats.connected || 'N/A', // Redis only
  timestamps: stats.timestamps.slice(0, 5) // Recent entries
});

// Memory cache specific stats
if (!stats.connected) {
  console.log(
    'Memory cache key ages:',
    stats.timestamps.map(t => `${Math.round(t.age / 1000)}s`)
  );
}
```

### Health Check Endpoint

Add cache health monitoring to your application:

```javascript
import { getUnifiedCache, CacheFactory } from './utils/CacheFactory.js';

app.get('/health/cache', async (req, res) => {
  try {
    const cache = await getUnifiedCache();
    const stats = await cache.getStats();
    const info = CacheFactory.getCacheInfo();

    res.json({
      status: 'healthy',
      strategy: info.strategy,
      defaultTtl: info.defaultTtl,
      size: stats.size,
      connected: stats.connected || true, // Memory cache is always "connected"
      sampleKeys: stats.keys.slice(0, 5)
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      strategy: CacheFactory.getCacheInfo().strategy,
      error: error.message
    });
  }
});
```

## Troubleshooting

### Common Issues

1. **Redis Connection Failed**
   - Check Redis server is running: `redis-cli ping`
   - Verify host, port, and credentials in environment variables
   - Check firewall/network connectivity
   - Application will automatically fallback to memory cache

2. **Memory Cache Not Persisting**
   - This is expected behavior - memory cache is cleared on restart
   - Switch to Redis for persistence across restarts
   - Consider this for development vs production environments

3. **High Memory Usage**
   - Monitor cache size regularly with `getStats()`
   - Implement proper TTL values for different data types
   - Consider cache size limits for memory cache
   - Use Redis for large-scale caching needs

4. **Performance Issues**
   - Use appropriate TTL values based on data freshness
   - Monitor cache hit/miss ratios
   - Consider cache key patterns and access frequency
   - Redis may have network latency vs memory cache speed

5. **Cache Keys Not Expiring**
   - Verify TTL values are set correctly (in milliseconds)
   - Check timer cleanup in memory cache
   - Ensure Redis TTL is being set properly

### Configuration Validation

```javascript
import { CacheFactory } from './utils/CacheFactory.js';

// Validate configuration on startup
const info = CacheFactory.getCacheInfo();
console.log('Cache Configuration:', info);

if (info.isRedis) {
  // Test Redis connection
  try {
    const cache = await CacheFactory.getInstance();
    await cache.set('health-check', 'ok', 5000);
    const value = await cache.get('health-check');
    console.log('Redis connection successful:', value === 'ok');
    await cache.delete('health-check');
  } catch (error) {
    console.error('Redis connection failed, falling back to memory:', error);
  }
} else {
  console.log('Using memory cache - suitable for development');
}
```
