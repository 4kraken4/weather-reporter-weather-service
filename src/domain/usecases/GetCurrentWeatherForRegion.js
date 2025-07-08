import { OpenWeather } from '../../interfaces/services/open-weather/OpenWeather.js';
import Weather from '../entities/Weather.js';

export default class GetCurrentWeatherForRegion {
  constructor(weatherRepository) {
    this.weatherRepository = weatherRepository;
  }

  async execute(regionId) {
    if (!/^\d+$/.test(regionId)) {
      throw new Error('InvalidRegionIdError');
    }
    try {
      const weatherData = await OpenWeather.getCurrentWeather(regionId);
      if (!weatherData || !weatherData.data) {
        throw new Error('WeatherDataNotFoundError');
      }
      return {
        success: true,
        data: Weather.fromJson(weatherData?.data)
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
}
