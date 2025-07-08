import Config from '../../../config/Config.js';
import UrlUtils from '../../../utils/UrlUtils.js';
import HttpClient from '../../http/HttpClient.js';

export class OpenWeather {
  static service = Config.getInstance().openWeather;
  static baseUrl = UrlUtils.buildServiceBaseUrl(
    {
      protocol: OpenWeather.service.protocol,
      host: OpenWeather.service.host,
      routePrefix: OpenWeather.service.routePrefix
    },
    false
  ); // Don't include service name for OpenWeather API
  static httpClient = new HttpClient(OpenWeather.baseUrl);

  static async getCurrentWeather(cityId) {
    const params = {
      id: cityId,
      appid: OpenWeather.service.apiKey,
      units: OpenWeather.service.units,
      lang: OpenWeather.service.lang,
      mode: OpenWeather.service.responseType
    };

    const endpointUrl = UrlUtils.buildEndpointUrl(
      OpenWeather.baseUrl,
      `${OpenWeather.service.currentWeatherDomain}/weather`,
      params
    );

    return OpenWeather.httpClient.get(endpointUrl);
  }

  static async getCurrentWeatherByName(cityName, countryCode = '') {
    const locationQuery = countryCode ? `${cityName},${countryCode}` : cityName;

    const params = {
      q: locationQuery,
      appid: OpenWeather.service.apiKey,
      units: OpenWeather.service.units,
      lang: OpenWeather.service.lang,
      mode: OpenWeather.service.responseType
    };

    const endpointUrl = UrlUtils.buildEndpointUrl(
      OpenWeather.baseUrl,
      `${OpenWeather.service.currentWeatherDomain}/weather`,
      params
    );

    return OpenWeather.httpClient.get(endpointUrl);
  }
}
