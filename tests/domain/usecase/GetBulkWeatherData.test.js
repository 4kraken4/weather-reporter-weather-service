/**
 * Test suite for GetBulkWeatherData use case
 * 
 * Tests the actual implementation which:
 * - Uses city names with country codes instead of city IDs
 * - Has enhanced response structure with metadata, summary, and processing time
 * - Uses CityNameUtils for name normalization, validation, and cache key generation
 * - Implements sophisticated caching with CacheFactory
 * - Returns detailed response structure suitable for frontend integration
 * - Has fallback city name variations for international cities
 * - Uses parallel processing with Promise.allSettled
 * - Includes comprehensive error handling and validation
 */

import GetBulkWeatherData from '../../../src/domain/usecases/GetBulkWeatherData.js';
import { OpenWeather } from '../../../src/interfaces/services/open-weather/OpenWeather.js';
import CityNameUtils from '../../../src/utils/CityNameUtils.js';
import { globalWeatherCache } from '../../../src/utils/MemoryCache.js';

// Mock the OpenWeather service
jest.mock('../../../src/interfaces/services/open-weather/OpenWeather.js', () => ({
  OpenWeather: {
    getCurrentWeatherByName: jest.fn()
  }
}));

// Mock the CacheFactory
jest.mock('../../../src/utils/CacheFactory.js', () => ({
  getUnifiedCache: jest.fn()
}));

// Mock the database connection
jest.mock('../../../db/mongoose.js', () => ({
  connectWithResilience: jest.fn().mockResolvedValue(true),
  mongoose: {
    connection: {
      readyState: 0,
      close: jest.fn().mockResolvedValue(true)
    }
  }
}));

describe('GetBulkWeatherData', () => {
  let getBulkWeatherData;
  let mockCache;

  beforeEach(() => {
    getBulkWeatherData = new GetBulkWeatherData();

    // Mock cache implementation
    mockCache = {
      has: jest.fn(),
      get: jest.fn(),
      set: jest.fn(),
      clear: jest.fn()
    };

    // Mock getUnifiedCache to return our mock cache
    const { getUnifiedCache } = require('../../../src/utils/CacheFactory.js');
    getUnifiedCache.mockResolvedValue(mockCache);

    globalWeatherCache.clear();
    jest.clearAllMocks();

    // Reset all CityNameUtils mocks
    jest.restoreAllMocks();

    // Suppress console.warn in tests
    jest.spyOn(console, 'warn').mockImplementation(() => { });
  });

  afterEach(() => {
    console.warn.mockRestore();
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    globalWeatherCache.clear();
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  describe('getCacheKey()', () => {
    it('should generate correct cache key with city and country', () => {
      const key = getBulkWeatherData.getCacheKey('London', 'GB');
      expect(key).toBe('london-gb');
    });

    it('should generate cache key for city without country', () => {
      const key = getBulkWeatherData.getCacheKey('Paris');
      expect(key).toBe('paris');
    });

    it('should handle special characters in city names', () => {
      const key = getBulkWeatherData.getCacheKey('São Paulo', 'BR');
      expect(key).toBe('sao-paulo-br');
    });
  });

  describe('Cache methods', () => {
    it('should check cache validity correctly', async () => {
      const cacheKey = 'london-gb';
      mockCache.has.mockReturnValue(true);

      const result = await getBulkWeatherData.isCacheValid(cacheKey);

      expect(result).toBe(true);
      expect(mockCache.has).toHaveBeenCalledWith(cacheKey);
    });

    it('should return false for invalid cache entries', async () => {
      const cacheKey = 'non-existent-key';
      mockCache.has.mockReturnValue(false);

      const result = await getBulkWeatherData.isCacheValid(cacheKey);

      expect(result).toBe(false);
      expect(mockCache.has).toHaveBeenCalledWith(cacheKey);
    });

    it('should store and retrieve data from cache', async () => {
      const cacheKey = 'paris-fr';
      const weatherData = {
        location: { name: 'Paris', country: 'France' },
        weather: { temperature: 18, condition: 'clear sky' }
      };

      mockCache.get.mockReturnValue(weatherData);
      mockCache.set.mockResolvedValue(true);

      await getBulkWeatherData.setCache(cacheKey, weatherData);
      const retrieved = await getBulkWeatherData.getFromCache(cacheKey);

      expect(retrieved).toEqual(weatherData);
      expect(mockCache.set).toHaveBeenCalledWith(cacheKey, weatherData, 300000); // 5 minutes
      expect(mockCache.get).toHaveBeenCalledWith(cacheKey);
    });
  });

  describe('transformWeatherData()', () => {
    it('should transform weather entity to expected frontend format', () => {
      const mockWeatherEntity = {
        cityName: 'London',
        coordinates: { lat: 51.5074, lon: -0.1278 },
        tempCelsius: 20.7,
        primaryCondition: {
          icon: '01d',
          description: 'clear sky'
        },
        system: { country: 'GB' },
        timestamp: 1640995200 // 2022-01-01 00:00:00 UTC
      };

      const transformed = getBulkWeatherData.transformWeatherData(mockWeatherEntity);

      expect(transformed).toEqual({
        location: {
          name: 'London',
          country: 'GB',
          countryCode: 'GB',
          coordinates: {
            lat: 51.5074,
            lon: -0.1278
          }
        },
        weather: {
          temperature: 21, // rounded from 20.7
          unit: '°C',
          condition: 'clear sky',
          icon: '01d',
          timestamp: '2022-01-01T00:00:00.000Z'
        }
      });
    });

    it('should handle missing optional fields gracefully', () => {
      const mockWeatherEntity = {
        cityName: 'TestCity',
        tempCelsius: 15.2,
        primaryCondition: {
          icon: '02d',
          description: 'few clouds'
        },
        timestamp: 1640995200
        // Missing coordinates and system
      };

      const transformed = getBulkWeatherData.transformWeatherData(mockWeatherEntity);

      expect(transformed).toEqual({
        location: {
          name: 'TestCity',
          country: 'Unknown',
          countryCode: '',
          coordinates: {
            lat: null,
            lon: null
          }
        },
        weather: {
          temperature: 15,
          unit: '°C',
          condition: 'few clouds',
          icon: '02d',
          timestamp: '2022-01-01T00:00:00.000Z'
        }
      });
    });

    it('should round temperature correctly', () => {
      const testCases = [
        { temp: 20.4, expected: 20 },
        { temp: 20.5, expected: 21 },
        { temp: 20.6, expected: 21 },
        { temp: -5.7, expected: -6 }
      ];

      testCases.forEach(({ temp, expected }) => {
        const mockWeatherEntity = {
          cityName: 'TestCity',
          tempCelsius: temp,
          primaryCondition: { icon: '01d', description: 'test' },
          timestamp: 1640995200
        };

        const result = getBulkWeatherData.transformWeatherData(mockWeatherEntity);
        expect(result.weather.temperature).toBe(expected);
      });
    });
  });

  describe('fetchSingleCityWeather()', () => {
    it('should fetch and transform weather data for a city with fallback variations', async () => {
      const mockResponse = {
        data: {
          coord: { lon: -0.1257, lat: 51.5085 },
          weather: [{ id: 800, main: 'Clear', description: 'clear sky', icon: '01d' }],
          main: { temp: 20.0 },
          name: 'London',
          sys: { country: 'GB' },
          dt: 1640995200
        }
      };

      // Mock CityNameUtils methods
      jest.spyOn(CityNameUtils, 'createFallbackNames').mockReturnValue(['London', 'london']);
      jest.spyOn(CityNameUtils, 'cleanForApiRequest').mockReturnValue('London');

      OpenWeather.getCurrentWeatherByName.mockResolvedValue(mockResponse);

      const result = await getBulkWeatherData.fetchSingleCityWeather('London', 'GB');

      expect(result).toEqual({
        location: {
          name: 'London',
          country: 'GB',
          countryCode: 'GB',
          coordinates: {
            lat: 51.5085,
            lon: -0.1257
          }
        },
        weather: {
          temperature: 20,
          unit: '°C',
          condition: 'clear sky',
          icon: '01d',
          timestamp: '2022-01-01T00:00:00.000Z'
        },
        meta: {
          attemptedVariations: ['London'],
          successfulVariation: 'London',
          source: 'api'
        }
      });

      expect(OpenWeather.getCurrentWeatherByName).toHaveBeenCalledWith('London', 'GB');
    });

    it('should try fallback variations when first attempt fails', async () => {
      jest.spyOn(CityNameUtils, 'createFallbackNames').mockReturnValue(['São Paulo', 'Sao Paulo', 'sao paulo']);
      jest.spyOn(CityNameUtils, 'cleanForApiRequest')
        .mockReturnValueOnce('São Paulo')
        .mockReturnValueOnce('Sao Paulo');

      const mockResponse = {
        data: {
          weather: [{ description: 'scattered clouds', icon: '03d' }],
          main: { temp: 25.0 },
          name: 'Sao Paulo',
          sys: { country: 'BR' },
          dt: 1640995200
        }
      };

      OpenWeather.getCurrentWeatherByName
        .mockRejectedValueOnce(new Error('City not found'))
        .mockResolvedValueOnce(mockResponse);

      const result = await getBulkWeatherData.fetchSingleCityWeather('São Paulo', 'BR');

      expect(result.meta.attemptedVariations).toEqual(['São Paulo', 'Sao Paulo']);
      expect(result.meta.successfulVariation).toBe('Sao Paulo');
      expect(OpenWeather.getCurrentWeatherByName).toHaveBeenCalledTimes(2);
    });

    it('should throw error when all variations fail', async () => {
      jest.spyOn(CityNameUtils, 'createFallbackNames').mockReturnValue(['InvalidCity', 'invalidcity']);
      jest.spyOn(CityNameUtils, 'cleanForApiRequest').mockReturnValue('InvalidCity');

      OpenWeather.getCurrentWeatherByName
        .mockRejectedValueOnce(new Error('City not found'))
        .mockRejectedValueOnce(new Error('City not found'));

      await expect(getBulkWeatherData.fetchSingleCityWeather('InvalidCity'))
        .rejects
        .toThrow('Failed to fetch weather for InvalidCity: City not found');
    });

    it('should handle null/empty response data', async () => {
      jest.spyOn(CityNameUtils, 'createFallbackNames').mockReturnValue(['TestCity']);
      jest.spyOn(CityNameUtils, 'cleanForApiRequest').mockReturnValue('TestCity');

      OpenWeather.getCurrentWeatherByName.mockResolvedValue(null);

      await expect(getBulkWeatherData.fetchSingleCityWeather('TestCity'))
        .rejects
        .toThrow('Failed to fetch weather for TestCity: No valid response');
    });
  });

  describe('execute()', () => {
    it('should throw error for invalid cities array', async () => {
      await expect(getBulkWeatherData.execute())
        .rejects
        .toThrow('Cities array is required and must not be empty');

      await expect(getBulkWeatherData.execute(null))
        .rejects
        .toThrow('Cities array is required and must not be empty');

      await expect(getBulkWeatherData.execute([]))
        .rejects
        .toThrow('Cities array is required and must not be empty');

      await expect(getBulkWeatherData.execute('not an array'))
        .rejects
        .toThrow('Cities array is required and must not be empty');
    });

    it('should return enhanced response structure with summary and metadata', async () => {
      const mockResponse = {
        data: {
          coord: { lon: -0.1257, lat: 51.5085 },
          weather: [{ description: 'clear sky', icon: '01d' }],
          main: { temp: 20.0 },
          name: 'London',
          sys: { country: 'GB' },
          dt: 1640995200
        }
      };

      // Mock CityNameUtils methods
      jest.spyOn(CityNameUtils, 'isValidCityName').mockReturnValue(true);
      jest.spyOn(CityNameUtils, 'createFallbackNames').mockReturnValue(['London']);
      jest.spyOn(CityNameUtils, 'cleanForApiRequest').mockReturnValue('London');

      OpenWeather.getCurrentWeatherByName.mockResolvedValue(mockResponse);
      mockCache.has.mockReturnValue(false);

      const cities = [{ city: 'London', country: 'GB' }];
      const result = await getBulkWeatherData.execute(cities);

      expect(result).toEqual({
        success: true,
        summary: {
          total: 1,
          found: 1,
          failed: 0,
          cached: 0
        },
        processingTimeMs: expect.any(Number),
        cities: [{
          searchIndex: 0,
          input: {
            city: 'London',
            country: 'GB'
          },
          status: 'found',
          location: {
            name: 'London',
            country: 'GB',
            countryCode: 'GB',
            coordinates: {
              lat: 51.5085,
              lon: -0.1257
            }
          },
          weather: {
            temperature: 20,
            unit: '°C',
            condition: 'clear sky',
            icon: '01d',
            timestamp: '2022-01-01T00:00:00.000Z'
          },
          error: null,
          meta: {
            cached: false,
            cacheKey: 'london-gb',
            attemptedVariations: ['London'],
            successfulVariation: 'London',
            source: 'api'
          }
        }]
      });

      expect(result.processingTimeMs).toBeGreaterThan(0);
    });

    it('should return cached data when available', async () => {
      const cachedData = {
        location: {
          name: 'London',
          country: 'GB',
          countryCode: 'GB',
          coordinates: { lat: 51.5085, lon: -0.1257 }
        },
        weather: {
          temperature: 20,
          unit: '°C',
          condition: 'clear sky',
          icon: '01d',
          timestamp: '2022-01-01T00:00:00.000Z'
        }
      };

      jest.spyOn(CityNameUtils, 'isValidCityName').mockReturnValue(true);

      mockCache.has.mockReturnValue(true);
      mockCache.get.mockReturnValue(cachedData);

      const cities = [{ city: 'London', country: 'GB' }];
      const result = await getBulkWeatherData.execute(cities);

      expect(result.summary.cached).toBe(1);
      expect(result.cities[0].status).toBe('found');
      expect(result.cities[0].meta.cached).toBe(true);
      expect(result.cities[0].meta.source).toBe('cache');
      expect(OpenWeather.getCurrentWeatherByName).not.toHaveBeenCalled();
    });

    it('should handle mixed success, failure, and cached results', async () => {
      const cities = [
        { city: 'London', country: 'GB' },    // will be cached
        { city: 'Paris', country: 'FR' },     // will succeed
        { city: 'InvalidCity', country: 'XX' }, // will fail
        { city: '', country: 'US' }           // invalid input
      ];

      // Mock city name utilities
      jest.spyOn(CityNameUtils, 'isValidCityName')
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(false);

      // Setup cache responses
      mockCache.has
        .mockReturnValueOnce(true)  // London cached
        .mockReturnValueOnce(false) // Paris not cached
        .mockReturnValueOnce(false); // InvalidCity not cached

      mockCache.get.mockReturnValueOnce({
        location: { name: 'London', country: 'GB' },
        weather: { temperature: 20, condition: 'clear sky' }
      });

      // Setup API responses
      jest.spyOn(CityNameUtils, 'createFallbackNames')
        .mockReturnValueOnce(['Paris'])
        .mockReturnValueOnce(['InvalidCity']);

      jest.spyOn(CityNameUtils, 'cleanForApiRequest')
        .mockReturnValueOnce('Paris')
        .mockReturnValueOnce('InvalidCity');

      OpenWeather.getCurrentWeatherByName
        .mockResolvedValueOnce({
          data: {
            weather: [{ description: 'few clouds', icon: '02d' }],
            main: { temp: 18.0 },
            name: 'Paris',
            sys: { country: 'FR' },
            dt: 1640995200
          }
        })
        .mockRejectedValueOnce(new Error('City not found'));

      const result = await getBulkWeatherData.execute(cities);

      expect(result.summary).toEqual({
        total: 4,
        found: 2,
        failed: 2,
        cached: 1
      });

      expect(result.cities).toHaveLength(4);
      expect(result.cities[0].status).toBe('found'); // London cached
      expect(result.cities[1].status).toBe('found'); // Paris API
      expect(result.cities[2].status).toBe('not-found'); // InvalidCity failed
      expect(result.cities[3].status).toBe('error'); // Empty city validation error
    });

    it('should handle parallel processing correctly', async () => {
      const cities = [
        { city: 'London', country: 'GB' },
        { city: 'Paris', country: 'FR' },
        { city: 'Tokyo', country: 'JP' }
      ];

      // Mock city name utilities for all cities
      jest.spyOn(CityNameUtils, 'isValidCityName')
        .mockReturnValue(true);
      jest.spyOn(CityNameUtils, 'createFallbackNames')
        .mockReturnValue(['test']);
      jest.spyOn(CityNameUtils, 'cleanForApiRequest')
        .mockReturnValue('test');

      mockCache.has.mockReturnValue(false);

      const mockResponse = {
        data: {
          weather: [{ description: 'clear sky', icon: '01d' }],
          main: { temp: 20.0 },
          name: 'TestCity',
          sys: { country: 'XX' },
          dt: 1640995200
        }
      };

      OpenWeather.getCurrentWeatherByName.mockResolvedValue(mockResponse);

      const startTime = Date.now();
      const result = await getBulkWeatherData.execute(cities);
      const endTime = Date.now();

      expect(result.cities).toHaveLength(3);
      expect(result.summary.total).toBe(3);
      expect(OpenWeather.getCurrentWeatherByName).toHaveBeenCalledTimes(3);

      // Verify parallel processing (should be much faster than sequential)
      expect(endTime - startTime).toBeLessThan(1000);
    });

    it('should handle cities without country codes', async () => {
      jest.spyOn(CityNameUtils, 'isValidCityName').mockReturnValue(true);
      jest.spyOn(CityNameUtils, 'createFallbackNames').mockReturnValue(['Delhi']);
      jest.spyOn(CityNameUtils, 'cleanForApiRequest').mockReturnValue('Delhi');

      const mockResponse = {
        data: {
          weather: [{ description: 'haze', icon: '50d' }],
          main: { temp: 28.0 },
          name: 'Delhi',
          dt: 1640995200
        }
      };

      mockCache.has.mockReturnValue(false);
      OpenWeather.getCurrentWeatherByName.mockResolvedValue(mockResponse);

      const cities = [{ city: 'Delhi' }];
      const result = await getBulkWeatherData.execute(cities);

      expect(result.cities[0].input.country).toBe('');
      expect(result.cities[0].meta.cacheKey).toBe('delhi');
      expect(OpenWeather.getCurrentWeatherByName).toHaveBeenCalledWith('Delhi', '');
    });

    it('should store successful API results in cache', async () => {
      jest.spyOn(CityNameUtils, 'isValidCityName').mockReturnValue(true);
      jest.spyOn(CityNameUtils, 'createFallbackNames').mockReturnValue(['Berlin']);
      jest.spyOn(CityNameUtils, 'cleanForApiRequest').mockReturnValue('Berlin');

      const mockResponse = {
        data: {
          weather: [{ description: 'clear sky', icon: '01d' }],
          main: { temp: 15.0 },
          name: 'Berlin',
          sys: { country: 'DE' },
          dt: 1640995200
        }
      };

      mockCache.has.mockReturnValue(false);
      mockCache.set.mockResolvedValue(true);
      OpenWeather.getCurrentWeatherByName.mockResolvedValue(mockResponse);

      const cities = [{ city: 'Berlin', country: 'DE' }];
      await getBulkWeatherData.execute(cities);

      expect(mockCache.set).toHaveBeenCalledWith(
        'berlin-de',
        {
          location: expect.any(Object),
          weather: expect.any(Object)
        },
        300000 // 5 minutes
      );
    });
  });

  describe('Result creation methods', () => {
    it('should create initial result structure correctly', () => {
      const cityRequest = { city: 'London', country: 'GB' };
      const result = getBulkWeatherData.createInitialResult(cityRequest, 0);

      expect(result).toEqual({
        searchIndex: 0,
        input: {
          city: 'London',
          country: 'GB'
        },
        status: 'error',
        error: null,
        location: null,
        weather: null,
        meta: {
          cached: false,
          cacheKey: null
        }
      });
    });

    it('should create validation error result', () => {
      const result = getBulkWeatherData.createInitialResult({ city: 'test' }, 0);
      const summary = { failed: 0 };

      const errorResult = getBulkWeatherData.createValidationErrorResult(result, 'test', summary);

      expect(errorResult.status).toBe('error');
      expect(errorResult.error).toEqual({
        code: 'INVALID_CITY_NAME',
        message: 'Invalid city name: test'
      });
      expect(summary.failed).toBe(1);
    });

    it('should create API error result', () => {
      const result = getBulkWeatherData.createInitialResult({ city: 'test' }, 0);
      const summary = { failed: 0 };
      const error = new Error('City not found');

      const errorResult = getBulkWeatherData.createApiErrorResult(result, error, 'test', summary);

      expect(errorResult.status).toBe('not-found');
      expect(errorResult.error).toEqual({
        code: 'CITY_NOT_FOUND',
        message: 'City not found'
      });
      expect(summary.failed).toBe(1);
    });

    it('should create cached result', () => {
      const result = getBulkWeatherData.createInitialResult({ city: 'test' }, 0);
      const summary = { found: 0, cached: 0 };
      const cached = {
        location: { name: 'Test' },
        weather: { temperature: 20 }
      };

      const cachedResult = getBulkWeatherData.createCachedResult(result, cached, summary);

      expect(cachedResult.status).toBe('found');
      expect(cachedResult.location).toEqual(cached.location);
      expect(cachedResult.weather).toEqual(cached.weather);
      expect(cachedResult.meta.cached).toBe(true);
      expect(cachedResult.meta.source).toBe('cache');
      expect(summary.found).toBe(1);
      expect(summary.cached).toBe(1);
    });
  });
});
