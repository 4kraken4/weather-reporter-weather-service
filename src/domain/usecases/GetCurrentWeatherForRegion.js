import { OpenWeather } from '../../interfaces/services/open-weather/OpenWeather.js';
import Weather from '../entities/Weather.js';

export default class GetCurrentWeatherForRegion {
  constructor(weatherRepository) {
    this.weatherRepository = weatherRepository;
  }

  async execute(regionId) {
    const weatherData = await OpenWeather.getCurrentWeather(regionId);
    if (!weatherData || !weatherData.data) {
      throw new Error('WeatherDataNotFoundError');
    }
    return {
      success: true,
      data: Weather.fromJson(weatherData?.data)
    };
  }
}
