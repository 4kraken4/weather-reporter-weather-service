import GetBulkWeatherData from '../../src/domain/usecases/GetBulkWeatherData.js';
import { OpenWeather } from '../../src/interfaces/services/open-weather/OpenWeather.js';
import { globalWeatherCache } from '../../src/utils/MemoryCache.js';

// Mock the OpenWeather service
jest.mock('../../src/interfaces/services/open-weather/OpenWeather.js', () => ({
  OpenWeather: {
    getCurrentWeather: jest.fn()
  }
}));

// Mock the CacheFactory
jest.mock('../../src/utils/CacheFactory.js', () => ({
  getUnifiedCache: jest.fn()
}));

// Mock the database connection
jest.mock('../../db/mongoose.js', () => ({
  connectWithResilience: jest.fn().mockResolvedValue(true),
  mongoose: {
    connection: {
      readyState: 0,
      close: jest.fn().mockResolvedValue(true)
    }
  }
}));

describe('GetBulkWeatherData - City ID Based Integration', () => {
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
    const { getUnifiedCache } = require('../../src/utils/CacheFactory.js');
    getUnifiedCache.mockResolvedValue(mockCache);

    globalWeatherCache.clear();
    jest.clearAllMocks();

    // Suppress console.warn in tests
    jest.spyOn(console, 'warn').mockImplementation(() => { });
  });

  afterEach(() => {
    console.warn.mockRestore();
  });

  afterAll(async () => {
    globalWeatherCache.clear();
    jest.clearAllTimers();
    jest.useRealTimers();
  }); describe('City ID based weather data handling', () => {
    const mockWeatherResponse = {
      data: {
        coord: { lat: 47.3769, lon: 8.5417 },
        weather: [{ main: 'Clouds', description: 'scattered clouds', icon: '03d' }],
        base: 'stations',
        main: {
          temp: 26, // Temperature in Celsius (metric units)
          feels_like: 25.7,
          temp_min: 25,
          temp_max: 27,
          pressure: 1013,
          humidity: 55
        },
        visibility: 10000,
        wind: { speed: 2.5, deg: 180 },
        clouds: { all: 40 },
        dt: 1640995200,
        sys: {
          type: 2,
          id: 2011358,
          country: 'CH',
          sunrise: 1640937567,
          sunset: 1640968832
        },
        timezone: 3600,
        id: 2657896,
        name: 'Zurich',
        cod: 200
      }
    };

    beforeEach(() => {
      OpenWeather.getCurrentWeather.mockResolvedValue(mockWeatherResponse);

      // Set up cache to return miss (no cached data)
      mockCache.get.mockReturnValue(null);
    });

    it('should handle Swiss cities using city IDs', async () => {
      const cities = [
        { cityId: '2657896' }, // Zurich
        { cityId: '2657895' }  // Another Swiss city
      ];

      const result = await getBulkWeatherData.execute(cities);

      expect(result.success).toBe(true);
      expect(Object.keys(result.data)).toHaveLength(2);

      // Check structure with cityId as key
      expect(result.data['2657896']).toBeDefined();
      expect(result.data['2657896']).toEqual({
        cityName: 'Zurich',
        country: 'CH',
        temperature: 26,
        icon: '03d',
        description: 'scattered clouds'
      });

      // Verify the API was called with city IDs
      expect(OpenWeather.getCurrentWeather).toHaveBeenCalledWith('2657896');
      expect(OpenWeather.getCurrentWeather).toHaveBeenCalledWith('2657895');
    });

    it('should handle Iranian cities with city IDs', async () => {
      // Mock response for Iranian city
      const iranianResponse = {
        data: {
          coord: { lat: 35.6892, lon: 51.3890 },
          weather: [{ main: 'Clear', description: 'clear sky', icon: '01d' }],
          base: 'stations',
          main: {
            temp: 31, // Temperature in Celsius
            feels_like: 33,
            temp_min: 30,
            temp_max: 32,
            pressure: 1013,
            humidity: 40
          },
          visibility: 10000,
          wind: { speed: 3.5, deg: 200 },
          clouds: { all: 0 },
          dt: 1640995200,
          sys: {
            type: 2,
            id: 2011358,
            country: 'IR',
            sunrise: 1640937567,
            sunset: 1640968832
          },
          timezone: 12600,
          id: 1234567,
          name: 'Hesar-e Sefid',
          cod: 200
        }
      };

      OpenWeather.getCurrentWeather.mockResolvedValue(iranianResponse);

      const cities = [
        { cityId: '1234567' } // Hypothetical Iranian city ID
      ];

      const result = await getBulkWeatherData.execute(cities);

      expect(result.success).toBe(true);
      expect(Object.keys(result.data)).toHaveLength(1);

      expect(result.data['1234567']).toEqual({
        cityName: 'Hesar-e Sefid',
        country: 'IR',
        temperature: 31,
        icon: '01d',
        description: 'clear sky'
      });
    });

    it('should validate city IDs correctly', async () => {
      const cities = [
        { cityId: '2657896' }, // Valid
        { cityId: 'invalid' },  // Invalid - not numeric
        { cityId: '' },         // Invalid - empty
        { cityId: 2643743 },    // Valid - numeric
      ];

      // Restore the global console.warn mock temporarily
      console.warn.mockRestore();

      // Create a new spy for this test
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => { });

      const result = await getBulkWeatherData.execute(cities);

      expect(result.success).toBe(true);
      // Should only process valid city IDs
      expect(Object.keys(result.data)).toHaveLength(2);

      // Verify warnings were logged for invalid IDs
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Invalid city ID format: invalid')
      );
      // Note: Empty string might be handled differently and not trigger warning

      // The afterEach will restore this automatically
    });

    it('should use cache for repeated requests with city IDs', async () => {
      const cities = [{ cityId: '2657896' }];

      // Set up cache to return null first, then cached data
      let getCallCount = 0;
      const cachedData = {
        location: {
          name: 'Zurich',
          country: 'CH',
          countryCode: 'CH',
          coordinates: { lat: 47.3769, lon: 8.5417 }
        },
        weather: {
          temperature: 26,
          unit: '°C',
          condition: 'scattered clouds',
          icon: '03d',
          timestamp: new Date(1640995200 * 1000).toISOString()
        }
      };

      mockCache.get.mockImplementation(() => {
        getCallCount++;
        return getCallCount > 1 ? cachedData : null;
      });

      // Reset the OpenWeather mock call count
      OpenWeather.getCurrentWeather.mockClear();

      // First request - should miss cache and call API
      const result1 = await getBulkWeatherData.execute(cities);
      expect(result1.success).toBe(true);
      expect(OpenWeather.getCurrentWeather).toHaveBeenCalledTimes(1);

      // Second request - should hit cache and not call API
      const result2 = await getBulkWeatherData.execute(cities);
      expect(result2.success).toBe(true);
      expect(OpenWeather.getCurrentWeather).toHaveBeenCalledTimes(1); // No additional call

      // Both results should be identical
      expect(result1.data).toEqual(result2.data);
    });

    it('should handle API failures gracefully with city IDs', async () => {
      OpenWeather.getCurrentWeather.mockRejectedValue(
        new Error('City not found')
      );

      const cities = [
        { cityId: '9999999' } // Non-existent city ID
      ];

      const warnSpy = jest.spyOn(console, 'warn');

      const result = await getBulkWeatherData.execute(cities);

      expect(result.success).toBe(true);
      expect(Object.keys(result.data)).toHaveLength(0); // No data for failed requests

      // Verify warning was logged
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to fetch weather for city ID 9999999')
      );
    });
  });
});
