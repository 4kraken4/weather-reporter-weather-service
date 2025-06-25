import { OpenWeather } from '../../interfaces/services/open-weather/OpenWeather.js';
import Weather from '../entities/Weather.js';

export default class GetCurrentWeatherByRegionName {
  constructor(regionRepository) {
    this.regionRepository = regionRepository;
  }

  async execute(region, countryCode) {
    if (!region || typeof region !== 'string' || region.length < 2) {
      throw new Error('InvalidRegionNameError');
    }
    if (!countryCode || typeof countryCode !== 'string' || countryCode.length !== 2) {
      throw new Error('InvalidCountryCodeError');
    }
    const regionData = await this.regionRepository.getRegionFromName(
      region,
      countryCode.toUpperCase()
    );
    if (!regionData) {
      throw new Error('RegionNotFoundError');
    }
    const currentWeather = await OpenWeather.getCurrentWeather(regionData?.id);

    if (!currentWeather || !currentWeather.data) {
      throw new Error('WeatherDataNotFoundError');
    }
    return {
      success: true,
      data: Weather.fromJson(currentWeather.data)
    };
  }
}
