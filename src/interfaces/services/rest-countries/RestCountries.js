import Config from '../../../config/Config.js';
import UrlUtils from '../../../utils/UrlUtils.js';
import HttpClient from '../../http/HttpClient.js';

export class RestCountries {
  static service = Config.getInstance().restCountries;
  static baseUrl = UrlUtils.buildServiceBaseUrl(
    {
      protocol: RestCountries.service.protocol,
      host: RestCountries.service.host,
      routePrefix: ''
    },
    false
  ); // Don't include service name for RestCountries API
  static httpClient = new HttpClient(RestCountries.baseUrl);

  static async getCountryByCode(countryCode) {
    const endpointUrl = UrlUtils.buildEndpointUrl(
      RestCountries.baseUrl,
      `${RestCountries.service.codeDetailsDomain}/${countryCode}`,
      {}
    );

    return RestCountries.httpClient.get(endpointUrl);
  }

  static async getCountryByName(countryName) {
    const endpointUrl = UrlUtils.buildEndpointUrl(
      RestCountries.baseUrl,
      `${RestCountries.service.nameDetailsDomain}/${encodeURIComponent(countryName)}`,
      {}
    );

    return RestCountries.httpClient.get(endpointUrl);
  }
}
