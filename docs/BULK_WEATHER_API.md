# Bulk Weather API Documentation

## Overview

The Bulk Weather API allows you to fetch weather data for multiple cities in a single request. This feature implements advanced caching strategies, intelligent city name processing, and comprehensive error handling to optimize performance and provide a robust weather service.

## Features

- **Bulk Weather Fetching**: Get weather for up to 15 cities in one request
- **Advanced Caching**: Configurable cache strategy (Redis/Memory) with 5-minute TTL
- **Smart City Name Processing**: International city name normalization and fallback variations
- **Comprehensive Error Handling**: Detailed error responses with validation
- **Performance Optimized**: Parallel processing with Promise.allSettled
- **Enhanced Response Structure**: Detailed metadata, summary, and processing time
- **City ID Support**: Supports both city names and OpenWeatherMap city IDs

## API Endpoint

### POST `/api/v1/weather/bulk`

Fetch weather data for multiple cities.

#### Request Body

```json
{
  "cities": [
    {
      "city": "London",
      "country": "GB"
    },
    {
      "city": "New York",
      "country": "US"
    },
    {
      "city": "São Paulo",
      "country": "BR"
    }
  ]
}
```

#### Alternative: City ID Request

```json
{
  "cities": [
    {
      "cityId": "2643743"
    },
    {
      "cityId": "5128581"
    }
  ]
}
```

#### Request Parameters

- `cities` (array, required): Array of city objects
  - **Option 1 - City Name**:
    - `city` (string, required): City name (supports international characters)
    - `country` (string, optional): ISO 3166-1 alpha-2 country code
  - **Option 2 - City ID**:
    - `cityId` (string/number, required): OpenWeatherMap city ID

#### Response Structure

```json
{
  "success": true,
  "summary": {
    "total": 3,
    "found": 2,
    "failed": 1,
    "cached": 1
  },
  "processingTimeMs": 245,
  "cities": [
    {
      "searchIndex": 0,
      "input": {
        "city": "London",
        "country": "GB"
      },
      "status": "found",
      "location": {
        "name": "London",
        "country": "United Kingdom",
        "countryCode": "GB",
        "coordinates": {
          "lat": 51.5085,
          "lon": -0.1257
        }
      },
      "weather": {
        "temperature": 15,
        "unit": "°C",
        "condition": "Overcast clouds",
        "icon": "04d",
        "timestamp": "2025-07-04T10:30:00.000Z"
      },
      "error": null,
      "meta": {
        "cached": false,
        "cacheKey": "london-gb",
        "attemptedVariations": ["London"],
        "successfulVariation": "London",
        "source": "api"
      }
    },
    {
      "searchIndex": 1,
      "input": {
        "city": "New York",
        "country": "US"
      },
      "status": "found",
      "location": {
        "name": "New York",
        "country": "United States of America",
        "countryCode": "US",
        "coordinates": {
          "lat": 40.7128,
          "lon": -74.006
        }
      },
      "weather": {
        "temperature": 22,
        "unit": "°C",
        "condition": "Clear sky",
        "icon": "01d",
        "timestamp": "2025-07-04T10:30:00.000Z"
      },
      "error": null,
      "meta": {
        "cached": true,
        "cacheKey": "new york-us",
        "source": "cache"
      }
    },
    {
      "searchIndex": 2,
      "input": {
        "city": "São Paulo",
        "country": "BR"
      },
      "status": "not-found",
      "location": null,
      "weather": null,
      "error": {
        "code": "CITY_NOT_FOUND",
        "message": "No weather data found for São Paulo"
      },
      "meta": {
        "cached": false,
        "cacheKey": "são paulo-br",
        "attemptedVariations": ["São Paulo", "Sao Paulo", "São Paulo"],
        "source": "api"
      }
    }
  ]
}
```

#### Response Fields

**Main Response:**

- `success` (boolean): Indicates if the request was successful
- `summary` (object): Request processing summary
  - `total` (number): Total cities requested
  - `found` (number): Successfully found cities
  - `failed` (number): Failed city requests
  - `cached` (number): Results served from cache
- `processingTimeMs` (number): Total processing time in milliseconds
- `cities` (array): Detailed results for each city

**City Result Object:**

- `searchIndex` (number): Original position in request array
- `input` (object): Original request parameters
- `status` (string): Result status - `'found'`, `'not-found'`, or `'error'`
- `location` (object, if found): Geographic information
  - `name` (string): Resolved city name
  - `country` (string): Full country name
  - `countryCode` (string): ISO country code
  - `coordinates` (object): Latitude and longitude
- `weather` (object, if found): Weather information
  - `temperature` (number): Temperature in Celsius (rounded)
  - `unit` (string): Temperature unit ("°C")
  - `condition` (string): Weather description
  - `icon` (string): Weather icon code
  - `timestamp` (string): ISO timestamp of weather data
- `error` (object, if failed): Error information
  - `code` (string): Error code
  - `message` (string): Human-readable error message
- `meta` (object): Processing metadata
  - `cached` (boolean): Whether result came from cache
  - `cacheKey` (string): Cache key used
  - `attemptedVariations` (array, if applicable): City name variations tried
  - `successfulVariation` (string, if applicable): Variation that succeeded
  - `source` (string): Data source - `'api'` or `'cache'`

## Error Responses

### 400 Bad Request

```json
{
  "success": false,
  "message": "Cities array is required and must not be empty"
}
```

```json
{
  "success": false,
  "message": "Maximum 15 cities allowed per request"
}
```

### Individual City Errors

Individual city errors are included in the response rather than failing the entire request:

```json
{
  "success": true,
  "summary": {
    "total": 2,
    "found": 1,
    "failed": 1,
    "cached": 0
  },
  "cities": [
    {
      "searchIndex": 1,
      "input": { "city": "InvalidCity", "country": "XX" },
      "status": "error",
      "error": {
        "code": "INVALID_CITY_NAME",
        "message": "Invalid city name: InvalidCity"
      },
      "meta": {
        "cached": false,
        "cacheKey": "invalidcity-xx"
      }
    }
  ]
}
```

## Usage Examples

### Frontend Integration (JavaScript/TypeScript)

```javascript
const apiService = {
  post: async (url, data) => {
    const response = await fetch(`https://your-api-url.com${url}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    return response.json();
  }
};

const fetchBulkWeather = async cities => {
  try {
    const result = await apiService.post('/api/v1/weather/bulk', { cities });

    // Enhanced response structure provides detailed information
    console.log(
      `Processed ${result.summary.total} cities in ${result.processingTimeMs}ms`
    );
    console.log(
      `Found: ${result.summary.found}, Failed: ${result.summary.failed}, Cached: ${result.summary.cached}`
    );

    return result.cities;
  } catch (error) {
    console.error('Failed to fetch bulk weather:', error);
    throw error;
  }
};

// Usage with city names
const cities = [
  { city: 'London', country: 'GB' },
  { city: 'Paris', country: 'FR' },
  { city: 'São Paulo', country: 'BR' }, // Supports international characters
  { city: 'New York' } // Country code optional
];

fetchBulkWeather(cities).then(results => {
  results.forEach(result => {
    if (result.status === 'found') {
      console.log(
        `${result.location.name}: ${result.weather.temperature}°C - ${result.weather.condition}`
      );
    } else {
      console.log(`${result.input.city}: ${result.error.message}`);
    }
  });
});

// Usage with city IDs
const cityIds = [
  { cityId: '2643743' }, // London
  { cityId: '5128581' } // New York
];

fetchBulkWeather(cityIds).then(results => {
  // Process results same as above
});
```

### React Hook Integration

```javascript
import { useState, useEffect } from 'react';

const useBulkWeather = cities => {
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!cities || cities.length === 0) return;

    const fetchWeather = async () => {
      try {
        setLoading(true);
        const result = await fetchBulkWeather(cities);
        setWeatherData(result);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, [cities]);

  return { weatherData, loading, error };
};

// Usage in component
const WeatherDashboard = () => {
  const cities = [
    { city: 'London', country: 'GB' },
    { city: 'Tokyo', country: 'JP' },
    { city: 'Sydney', country: 'AU' }
  ];

  const { weatherData, loading, error } = useBulkWeather(cities);

  if (loading) return <div>Loading weather data...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {weatherData?.map((result, index) => (
        <div key={index}>
          {result.status === 'found' ? (
            <div>
              <h3>{result.location.name}</h3>
              <p>
                {result.weather.temperature}°C - {result.weather.condition}
              </p>
              {result.meta.cached && <small>Cached data</small>}
            </div>
          ) : (
            <div>
              <h3>{result.input.city}</h3>
              <p>Error: {result.error.message}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
```

### cURL Examples

#### Basic city name request:

```bash
curl -X POST "http://localhost:9001/api/v1/weather/bulk" \
  -H "Content-Type: application/json" \
  -d '{
    "cities": [
      {"city": "London", "country": "GB"},
      {"city": "New York", "country": "US"},
      {"city": "Tokyo", "country": "JP"}
    ]
  }'
```

#### City ID request:

```bash
curl -X POST "http://localhost:9001/api/v1/weather/bulk" \
  -H "Content-Type: application/json" \
  -d '{
    "cities": [
      {"cityId": "2643743"},
      {"cityId": "5128581"}
    ]
  }'
```

#### Mixed request (cities with and without country codes):

```bash
curl -X POST "http://localhost:9001/api/v1/weather/bulk" \
  -H "Content-Type: application/json" \
  -d '{
    "cities": [
      {"city": "London", "country": "GB"},
      {"city": "Paris"},
      {"city": "São Paulo", "country": "BR"}
    ]
  }'
```

## Advanced Features

### International City Name Support

The API includes sophisticated city name processing for international cities:

```javascript
// These are all handled intelligently:
const cities = [
  { city: 'São Paulo', country: 'BR' }, // Portuguese characters
  { city: 'Zürich', country: 'CH' }, // German umlauts
  { city: 'México City', country: 'MX' }, // Spanish characters
  { city: 'Москва', country: 'RU' }, // Cyrillic characters
  { city: '北京', country: 'CN' } // Chinese characters
];
```

**Fallback Mechanisms:**

- Automatic diacritic normalization (São Paulo → Sao Paulo)
- Multiple name variations tried for complex city names
- Comprehensive Unicode support
- District name extraction (e.g., "London (Greater London)" → "London")

### Cache Strategy Configuration

The API supports two caching strategies configured via environment variables:

**Memory Cache (Development):**

```bash
CACHE_STRATEGY=memory
CACHE_DEFAULT_TTL=300000  # 5 minutes
```

**Redis Cache (Production):**

```bash
CACHE_STRATEGY=redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_KEY_PREFIX=weather:
CACHE_DEFAULT_TTL=300000  # 5 minutes
```

### City ID vs City Name Performance

**City IDs** (recommended for production):

- Faster and more reliable
- No ambiguity in city identification
- Consistent results across different locales
- Direct OpenWeatherMap API mapping

**City Names** (better for user input):

- More user-friendly
- Supports international characters
- Automatic fallback variations
- Smart normalization and validation

## Performance & Architecture

### Processing Strategy

- **Parallel Processing**: All city requests processed concurrently using `Promise.allSettled`
- **Error Isolation**: Individual city failures don't affect other requests
- **Graceful Degradation**: Invalid cities are skipped, valid ones are returned
- **Rate Limiting**: Maximum 15 cities per request to prevent overload
- **Timeout Handling**: Individual timeouts don't block the entire batch

### Cache Implementation

**Cache Key Format:**

- City names: `{normalized-city}-{country}` (e.g., "london-gb")
- City IDs: `cityid_{id}` (e.g., "cityid_2643743")

**Cache Benefits:**

- **Performance**: Up to 80% faster response times for cached data
- **Cost Reduction**: Significantly reduces external API calls
- **Reliability**: Cached data available even during API outages
- **Scalability**: Redis cache shared across multiple service instances

### Response Time Optimization

- **Memory Cache**: ~5-10ms for cached results
- **Redis Cache**: ~15-30ms for cached results
- **API Calls**: ~200-500ms for fresh data
- **Parallel Processing**: Multiple cities processed simultaneously
- **Processing Time Tracking**: Every response includes `processingTimeMs`

## Frontend Integration Patterns

### Batch Request Optimization

The enhanced response structure is designed for modern frontend patterns:

```javascript
// Frontend batching logic
class WeatherBatchService {
  constructor() {
    this.pendingRequests = new Map();
    this.batchTimeout = null;
  }

  async getWeather(city, country) {
    const key = `${city}-${country}`;

    // Return existing promise if already requested
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key);
    }

    // Create new promise and batch it
    const promise = new Promise((resolve, reject) => {
      this.scheduleRequest(city, country, resolve, reject);
    });

    this.pendingRequests.set(key, promise);
    return promise;
  }

  scheduleRequest(city, country, resolve, reject) {
    // Batch multiple requests together
    clearTimeout(this.batchTimeout);
    this.batchTimeout = setTimeout(() => {
      this.executeBatch();
    }, 50); // 50ms batch window
  }

  async executeBatch() {
    const requests = Array.from(this.pendingRequests.entries());
    this.pendingRequests.clear();

    const cities = requests.map(([key, promise]) => {
      const [city, country] = key.split('-');
      return { city, country };
    });

    try {
      const result = await fetchBulkWeather(cities);

      // Distribute results back to individual promises
      result.forEach((cityResult, index) => {
        const [key, promise] = requests[index];
        const resolve = promise._resolve;

        if (cityResult.status === 'found') {
          resolve(cityResult);
        } else {
          promise._reject(new Error(cityResult.error.message));
        }
      });
    } catch (error) {
      // Reject all pending promises
      requests.forEach(([key, promise]) => {
        promise._reject(error);
      });
    }
  }
}
```

### State Management Integration

```javascript
// Redux/Zustand store integration
const useWeatherStore = create((set, get) => ({
  weatherCache: {},

  async fetchWeather(cities) {
    const result = await fetchBulkWeather(cities);

    const newCache = { ...get().weatherCache };
    result.forEach(cityResult => {
      if (cityResult.status === 'found') {
        const key = cityResult.meta.cacheKey;
        newCache[key] = {
          ...cityResult,
          expiresAt: Date.now() + 300000 // 5 minutes
        };
      }
    });

    set({ weatherCache: newCache });
    return result;
  },

  getCachedWeather(city, country) {
    const key = `${city.toLowerCase()}-${country.toLowerCase()}`;
    const cached = get().weatherCache[key];

    if (cached && cached.expiresAt > Date.now()) {
      return cached;
    }
    return null;
  }
}));
```

## Error Handling & Validation

### City Name Validation

The API performs comprehensive validation on city names:

```javascript
// Valid city names
const validCities = [
  'London',
  'New York',
  'São Paulo',
  '北京',
  'Москва',
  'Al-Qāhirah' // Cairo in Arabic
];

// Invalid city names (will be rejected)
const invalidCities = [
  '', // Empty string
  '123', // Only numbers
  '!!!', // Only special characters
  'x', // Too short
  'A'.repeat(101) // Too long (>100 chars)
];
```

### Error Codes & Handling

**INVALID_CITY_NAME:**

```json
{
  "status": "error",
  "error": {
    "code": "INVALID_CITY_NAME",
    "message": "Invalid city name: 123"
  }
}
```

**CITY_NOT_FOUND:**

```json
{
  "status": "not-found",
  "error": {
    "code": "CITY_NOT_FOUND",
    "message": "No weather data found for UnknownCity"
  },
  "meta": {
    "attemptedVariations": ["UnknownCity", "Unknown City", "unknown-city"]
  }
}
```

### Request Validation

```javascript
// Request validation rules
const validation = {
  cities: {
    required: true,
    type: 'array',
    maxLength: 15,
    minLength: 1
  },
  'cities[].city': {
    type: 'string',
    minLength: 1,
    maxLength: 100,
    pattern: /^[a-zA-Z\u00C0-\u017F\u4e00-\u9fff\u0400-\u04FF\s\-'.()]+$/
  },
  'cities[].country': {
    type: 'string',
    pattern: /^[A-Z]{2}$/,
    optional: true
  },
  'cities[].cityId': {
    type: ['string', 'number'],
    pattern: /^\d+$/,
    optional: true
  }
};
```

## Testing & Development

### Running Tests

```bash
# Run bulk weather specific tests
npm test -- --testPathPattern=GetBulkWeatherData.test.js

# Run all weather controller tests
npm test -- --testPathPattern=weatherController

# Run tests with coverage
npm run test:coverage

# Run integration tests for complex city names
npm test -- --testPathPattern=ComplexCityNames.test.js
```

### Manual Testing Scripts

```bash
# Test bulk weather API manually
node scripts/test-bulk-weather.js

# Test international city name handling
node scripts/test-search-regions-deduplication.js
```

### Test Coverage

The test suite includes comprehensive coverage for:

- **Input Validation**: All request validation scenarios
- **City Name Processing**: International character handling, normalization
- **Cache Operations**: Memory and Redis cache strategies
- **Error Scenarios**: Network failures, invalid cities, API errors
- **Parallel Processing**: Concurrent request handling
- **Response Structure**: All response fields and metadata
- **Performance**: Processing time validation

### Example Test Scenarios

```javascript
// Test cases include:
describe('GetBulkWeatherData', () => {
  it('should handle international city names', async () => {
    const cities = [
      { city: 'São Paulo', country: 'BR' },
      { city: 'Zürich', country: 'CH' },
      { city: '北京', country: 'CN' }
    ];

    const result = await getBulkWeatherData.execute(cities);
    expect(result.summary.found).toBeGreaterThan(0);
  });

  it('should return cached data when available', async () => {
    // First request
    await getBulkWeatherData.execute([{ city: 'London', country: 'GB' }]);

    // Second request should use cache
    const result = await getBulkWeatherData.execute([
      { city: 'London', country: 'GB' }
    ]);
    expect(result.cities[0].meta.cached).toBe(true);
    expect(result.summary.cached).toBe(1);
  });

  it('should handle mixed success and failure scenarios', async () => {
    const cities = [
      { city: 'London', country: 'GB' }, // Valid
      { city: 'InvalidCity', country: 'XX' } // Invalid
    ];

    const result = await getBulkWeatherData.execute(cities);
    expect(result.summary.found).toBe(1);
    expect(result.summary.failed).toBe(1);
  });
});
```

### Development Environment Setup

```bash
# Clone repository
git clone <your-repo-url>
cd weather-reporter-weather-service

# Install dependencies
npm install

# Set up environment variables
cp src/.env.development.example src/.env.development
# Edit src/.env.development with your API keys

# Start development server
npm run dev

# Test the bulk weather endpoint
curl -X POST "http://localhost:9001/api/v1/weather/bulk" \
  -H "Content-Type: application/json" \
  -d '{"cities":[{"city":"London","country":"GB"}]}'
```

## Dependencies & Architecture

### Core Dependencies

- **Express.js**: Web framework for API endpoints
- **axios**: HTTP client for external API calls with retry logic
- **ioredis**: Redis client for distributed caching
- **opossum**: Circuit breaker pattern implementation
- **retry**: Configurable retry mechanism for failed requests
- **mongoose**: MongoDB object modeling for geographic data

### Architecture Integration

The Bulk Weather API is built using **Clean Architecture** principles:

```
├── Domain Layer
│   ├── entities/Weather.js          # Weather data model
│   ├── usecases/GetBulkWeatherData.js   # Business logic
│   └── repositories/               # Data access interfaces
├── Infrastructure Layer
│   ├── errors/                     # Custom error classes
│   ├── middlewares/errorHandler.js # Express error handling
│   └── orm/                        # Database implementations
├── Interface Layer
│   ├── controllers/weatherController.js  # HTTP request handling
│   ├── services/OpenWeather.js     # External API integration
│   └── routes/                     # API route definitions
└── Utils Layer
    ├── CacheFactory.js             # Cache strategy factory
    ├── CityNameUtils.js            # City name processing
    └── MemoryCache.js / RedisCache.js  # Cache implementations
```

### Design Patterns Used

- **Factory Pattern**: `CacheFactory.js` for cache strategy selection
- **Repository Pattern**: Abstracts data access from business logic
- **Circuit Breaker**: `opossum` for handling external API failures
- **Command Pattern**: Use cases encapsulate business operations
- **Strategy Pattern**: Configurable cache strategies (Memory/Redis)

### External API Integration

**OpenWeatherMap API:**

- Current weather endpoint: `/data/2.5/weather`
- Supports both city names and city IDs
- Automatic retry logic with exponential backoff
- Circuit breaker protection against API failures

**REST Countries API:**

- Used for country code validation and enrichment
- Fallback data source for geographic information
- Cached responses to minimize external calls

---

## Related Documentation

- **[Cache System](./CACHE_SYSTEM.md)** - Detailed cache configuration and strategies
- **[Complex City Names](./COMPLEX_CITY_NAMES_SOLUTION.md)** - International city name handling
- **[Database Integration](./DATABASE_INTEGRATION.md)** - MongoDB setup and optimization
- **[URL Standardization](./URL_STANDARDIZATION.md)** - API URL handling best practices

---

**Last Updated**: July 2025  
**API Version**: v1.0.0  
**Supported Node.js**: 18.x+
