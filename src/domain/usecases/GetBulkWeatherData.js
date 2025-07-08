import { OpenWeather } from '../../interfaces/services/open-weather/OpenWeather.js';
import { getUnifiedCache } from '../../utils/CacheFactory.js';
import CityNameUtils from '../../utils/CityNameUtils.js';
import { createModuleLogger } from '../../utils/Logger.js';
import Weather from '../entities/Weather.js';

const logger = createModuleLogger('GetBulkWeatherData');

/**
 * Use case for fetching weather data for multiple cities in bulk
 * Provides enhanced response structure for frontend city search functionality
 *
 * Features:
 * - Parallel processing of multiple city requests
 * - Intelligent caching with configurable duration
 * - Fallback city name variations for international cities
 * - Comprehensive error handling and validation
 * - Frontend-friendly response structure with metadata
 *
 * @example
 * const getBulkWeather = new GetBulkWeatherData();
 * const result = await getBulkWeather.execute([
 *   { city: "London", country: "GB" },
 *   { city: "Tokyo", country: "JP" }
 * ]);
 */
export default class GetBulkWeatherData {
  constructor() {
    this.CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
    this.cache = null;
  }

  /**
   * Initialize cache if not already done
   */
  async initializeCache() {
    if (!this.cache) {
      this.cache = await getUnifiedCache();
    }
    return this.cache;
  }

  /**
   * Get cache key for a city request
   */
  getCacheKey(city, country = '') {
    return CityNameUtils.generateCacheKey(city, country);
  }

  /**
   * Check if cached data is still valid
   */
  async isCacheValid(cacheKey) {
    const cache = await this.initializeCache();
    return cache.has(cacheKey);
  }

  /**
   * Get weather data from cache
   */
  async getFromCache(cacheKey) {
    const cache = await this.initializeCache();
    return cache.get(cacheKey);
  }

  /**
   * Store weather data in cache
   */
  async setCache(cacheKey, data) {
    const cache = await this.initializeCache();
    return cache.set(cacheKey, data, this.CACHE_DURATION);
  }

  /**
   * Create initial result structure for a city request
   */
  createInitialResult(cityRequest, index) {
    // Handle both city name and city ID requests
    const input = cityRequest.cityId
      ? { cityId: cityRequest.cityId }
      : { city: cityRequest.city, country: cityRequest.country || '' };

    return {
      searchIndex: index,
      input,
      status: 'error',
      error: null,
      location: null,
      weather: null,
      meta: {
        cached: false,
        cacheKey: null
      }
    };
  }

  /**
   * Create error result for invalid city names
   */
  createValidationErrorResult(result, cityName, summary) {
    result.status = 'error';
    result.error = {
      code: 'INVALID_CITY_NAME',
      message: `Invalid city name: ${cityName}`
    };
    summary.failed++;
    return result;
  }

  /**
   * Create error result for failed API requests
   */
  createApiErrorResult(result, error, cityName, summary) {
    result.status = 'not-found';
    result.error = {
      code: 'CITY_NOT_FOUND',
      message: error.message || `No weather data found for ${cityName}`
    };
    summary.failed++;
    logger.warn(`Failed to fetch weather for ${cityName}: ${error.message}`);
    return result;
  }

  /**
   * Create successful result from cached data
   */
  createCachedResult(result, cached, summary) {
    result.status = 'found';
    result.location = cached.location;
    result.weather = cached.weather;
    result.meta.cached = true;
    result.meta.source = 'cache';
    summary.found++;
    summary.cached++;
    return result;
  }

  /**
   * Create successful result from API data
   */
  createApiResult(result, weatherData, summary) {
    result.status = 'found';
    result.location = weatherData.location;
    result.weather = weatherData.weather;
    result.meta = {
      ...result.meta,
      ...weatherData.meta,
      cached: false
    };
    summary.found++;
    return result;
  }

  /**
   * Transform weather data to the format expected by frontend
   */
  transformWeatherData(weatherEntity) {
    const condition = weatherEntity.primaryCondition;
    return {
      location: {
        name: weatherEntity.cityName,
        country: weatherEntity.system?.country || 'Unknown',
        countryCode: weatherEntity.system?.country || '',
        coordinates: {
          lat: weatherEntity.coordinates?.lat || null,
          lon: weatherEntity.coordinates?.lon || null
        }
      },
      weather: {
        temperature: Math.round(weatherEntity.tempCelsius),
        unit: '°C',
        condition: condition.description,
        icon: condition.icon,
        timestamp: new Date(weatherEntity.timestamp * 1000).toISOString()
      }
    };
  }

  /**
   * Process a single city request
   */
  async processCityRequest(cityRequest, index, summary) {
    const result = this.createInitialResult(cityRequest, index);

    try {
      // Handle city ID requests
      if (cityRequest.cityId) {
        return await this.processCityIdRequest(cityRequest, result, summary);
      }

      // Handle city name requests
      const normalizedCityName = CityNameUtils.normalizeCityName(cityRequest.city);

      // Validate city name
      if (!CityNameUtils.isValidCityName(normalizedCityName)) {
        return this.createValidationErrorResult(result, cityRequest.city, summary);
      }

      // Set cache key
      const cacheKey = this.getCacheKey(normalizedCityName, cityRequest.country);
      result.meta.cacheKey = cacheKey;

      // Try to get from cache first
      const cached = await this.getFromCache(cacheKey);
      if (cached) {
        return this.createCachedResult(result, cached, summary);
      }

      // Fetch from API if not cached
      const weatherData = await this.fetchSingleCityWeather(
        cityRequest.city,
        cityRequest.country
      );

      // Store in cache for future requests
      await this.cacheWeatherData(cacheKey, weatherData);

      return this.createApiResult(result, weatherData, summary);
    } catch (error) {
      return this.createApiErrorResult(
        result,
        error,
        cityRequest.city || cityRequest.cityId,
        summary
      );
    }
  }

  /**
   * Process a city ID request
   */
  async processCityIdRequest(cityRequest, result, summary) {
    const { cityId } = cityRequest;

    // Validate city ID format (should be numeric string or number)
    if (!this.isValidCityId(cityId)) {
      logger.warn(`Invalid city ID format: ${cityId}`);
      return this.createValidationErrorResult(result, cityId, summary);
    }

    // Set cache key for city ID
    const cacheKey = `cityid_${cityId}`;
    result.meta.cacheKey = cacheKey;

    // Try to get from cache first
    const cached = await this.getFromCache(cacheKey);
    if (cached) {
      return this.createCachedResult(result, cached, summary);
    }

    try {
      // Fetch from API using city ID
      const response = await OpenWeather.getCurrentWeather(String(cityId));

      if (!response || !response.data) {
        throw new Error('No data returned from weather service');
      }

      // Convert response to Weather entity, then transform
      const weatherEntity = Weather.fromJson(response.data);
      const weatherData = this.transformWeatherData(weatherEntity);

      // Add metadata about the successful request
      const enrichedWeatherData = {
        ...weatherData,
        meta: {
          source: 'api'
        }
      };

      // Store in cache for future requests
      await this.cacheWeatherData(cacheKey, enrichedWeatherData);

      return this.createApiResult(result, enrichedWeatherData, summary);
    } catch (error) {
      logger.warn(`Failed to fetch weather for city ID ${cityId}: ${error.message}`);
      return this.createApiErrorResult(result, error, cityId, summary);
    }
  }

  /**
   * Validate city ID format
   */
  isValidCityId(cityId) {
    if (!cityId) return false;

    // Accept numeric strings or numbers
    const idStr = String(cityId);
    return /^\d+$/.test(idStr) && idStr.length > 0;
  }

  /**
   * Cache weather data for future requests
   */
  async cacheWeatherData(cacheKey, weatherData) {
    const cacheData = {
      location: weatherData.location,
      weather: weatherData.weather
    };
    await this.setCache(cacheKey, cacheData);
  }

  /**
   * Process settled promises and extract successful results
   */
  extractResults(settledResults) {
    const results = [];
    settledResults.forEach(settledResult => {
      if (settledResult.status === 'fulfilled' && settledResult.value) {
        results.push(settledResult.value);
      }
    });
    return results;
  }

  /**
   * Create final response structure
   */
  createResponse(summary, processingTime, results) {
    const response = {
      success: true,
      summary,
      processingTimeMs: processingTime,
      cities: results
    };

    // For city ID requests, also add a data property with cityId as key
    const cityIdResults = results.filter(r => r.input.cityId);
    if (cityIdResults.length > 0) {
      response.data = {};
      cityIdResults.forEach(result => {
        if (result.status === 'found') {
          response.data[result.input.cityId] = {
            cityName: result.location.name,
            country: result.location.countryCode,
            temperature: result.weather.temperature,
            icon: result.weather.icon,
            description: result.weather.condition
          };
        }
      });
    }

    return response;
  }

  /**
   * Fetch weather for a single city with fallback attempts
   * Returns enhanced weather data with metadata
   */
  async fetchSingleCityWeather(city, country = '') {
    // Get possible variations of the city name to try
    const cityVariations = CityNameUtils.createFallbackNames(city);

    let lastError;
    const attemptedVariations = [];

    // Try each variation until one works
    for (const cityVariation of cityVariations) {
      try {
        const cleanedCity = CityNameUtils.cleanForApiRequest(cityVariation);
        attemptedVariations.push(cityVariation);

        // eslint-disable-next-line no-await-in-loop
        const weatherResponse = await OpenWeather.getCurrentWeatherByName(
          cleanedCity,
          country
        );

        if (!weatherResponse || !weatherResponse.data) {
          continue; // Try next variation
        }

        const weatherEntity = Weather.fromJson(weatherResponse.data);
        const transformedData = this.transformWeatherData(weatherEntity);

        // Add metadata about the successful request
        return {
          ...transformedData,
          meta: {
            attemptedVariations,
            successfulVariation: cityVariation,
            source: 'api'
          }
        };
      } catch (error) {
        lastError = error;
        continue; // Try next variation
      }
    }

    // If all variations failed, throw the last error
    throw new Error(
      `Failed to fetch weather for ${city}: ${lastError?.message || 'No valid response'}`
    );
  }

  /**
   * Execute bulk weather data retrieval for multiple cities
   *
   * @param {Array<{city: string, country?: string}>} cities - Array of city objects to fetch weather for
   * @returns {Promise<{
   *   success: boolean,
   *   summary: {total: number, found: number, failed: number, cached: number},
   *   processingTimeMs: number,
   *   cities: Array<{
   *     searchIndex: number,
   *     input: {city: string, country: string},
   *     status: 'found'|'not-found'|'error',
   *     location?: {name: string, country: string, countryCode: string, coordinates: {lat: number, lon: number}},
   *     weather?: {temperature: number, unit: string, condition: string, icon: string, timestamp: string},
   *     error?: {code: string, message: string},
   *     meta: {cached: boolean, cacheKey: string, attemptedVariations?: Array<string>, successfulVariation?: string, source?: string}
   *   }>
   * }>} Enhanced response structure for frontend integration
   * @throws {Error} When cities array is invalid or empty
   */
  async execute(cities) {
    if (!Array.isArray(cities) || cities.length === 0) {
      throw new Error('Cities array is required and must not be empty');
    }

    const startTime = Date.now();
    const summary = {
      total: cities.length,
      found: 0,
      failed: 0,
      cached: 0
    };

    // Initialize cache once
    await this.initializeCache();

    // Process all cities in parallel
    const cityPromises = cities.map((cityRequest, index) =>
      this.processCityRequest(cityRequest, index, summary)
    );

    // Wait for all processing to complete
    const settledResults = await Promise.allSettled(cityPromises);

    // Extract and sort results
    const results = this.extractResults(settledResults);
    results.sort((a, b) => a.searchIndex - b.searchIndex);

    const processingTime = Date.now() - startTime;

    return this.createResponse(summary, processingTime, results);
  }
}
