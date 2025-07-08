import { OpenWeather } from '../../interfaces/services/open-weather/OpenWeather.js';
import Weather from '../entities/Weather.js';

export default class GetCurrentWeatherByRegionName {
  constructor(regionRepository) {
    this.regionRepository = regionRepository;
  }

  async execute(region, countryCode) {
    // Validate region name
    if (
      !region ||
      typeof region !== 'string' ||
      // eslint-disable-next-line security/detect-unsafe-regex -- Validated safe regex for region name validation
      !/^(?=.{1,32}$)(?!.* {2,})\p{L}[\p{L}'.-]{1,}(?: \p{L}[\p{L}'.-]{1,})*$/u.test(
        region.trim()
      )
    ) {
      throw new Error('InvalidRegionNameError');
    }

    // Validate country code
    if (
      !countryCode ||
      typeof countryCode !== 'string' ||
      !/^[a-zA-Z]{2}$/.test(countryCode.trim())
    ) {
      throw new Error('InvalidCountryCodeError');
    }

    const regionData = await this.regionRepository.getRegionFromName(
      region.trim(),
      countryCode.trim().toUpperCase()
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
