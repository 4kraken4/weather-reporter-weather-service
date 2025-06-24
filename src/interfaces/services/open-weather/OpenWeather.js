import Config from '../../../config/Config.js';
import HttpClient from '../../http/HttpClient.js';

export class OpenWeather {
  static service = Config.getInstance().openWeather;
  static httpClient = new HttpClient(
    `${OpenWeather.service.protocol}://${OpenWeather.service.host}`
  );

  static async getCurrentWeather(cityId) {
    const url = `${OpenWeather.service.currentWeatherDomain}/weather?id=${cityId}&appid=${OpenWeather.service.apiKey}`;
    return OpenWeather.httpClient.get(url);
  }
}
