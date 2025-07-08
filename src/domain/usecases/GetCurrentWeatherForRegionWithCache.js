import Config from '../../config/Config.js';
import { OpenWeather } from '../../interfaces/services/open-weather/OpenWeather.js';
import { getUnifiedCache } from '../../utils/CacheFactory.js';
import Weather from '../entities/Weather.js';

export default class GetCurrentWeatherForRegionWithCache {
  constructor(weatherRepository) {
    this.weatherRepository = weatherRepository;
    this.config = Config.getInstance();
  }

  async execute(regionId) {
    if (!/^\d+$/.test(regionId)) {
      throw new Error('InvalidRegionIdError');
    }

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

      // If not in cache, fetch from API
      const weatherData = await OpenWeather.getCurrentWeather(regionId);
      if (!weatherData || !weatherData.data) {
        throw new Error('WeatherDataNotFoundError');
      }

      const weatherEntity = Weather.fromJson(weatherData.data);

      // Cache the result with default TTL from config
      await cache.set(cacheKey, weatherEntity, this.config.cache.defaultTtl);

      return {
        success: true,
        data: weatherEntity,
        source: 'api'
      };
    } catch (error) {
      // If it's our own WeatherDataNotFoundError, re-throw it
      if (error.message === 'WeatherDataNotFoundError') {
        throw error;
      }
      // For other errors, propagate the original error
      throw error;
    }
  }

  /**
   * Clear cache for a specific region
   */
  async clearCache(regionId) {
    const cacheKey = `current_weather:${regionId}`;
    const cache = await getUnifiedCache();
    return cache.delete(cacheKey);
  }

  /**
   * Clear all weather cache
   */
  async clearAllCache() {
    const cache = await getUnifiedCache();
    return cache.clear();
  }
}
