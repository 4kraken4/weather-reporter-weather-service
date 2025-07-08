import Config from '../../config/Config.js';
import { RestCountries } from '../../interfaces/services/rest-countries/RestCountries.js';
import { getCircuitBreakerInstance } from '../../utils/CircuiteBreaker.js';
import Region from '../entities/Region.js';

export default class SearchRegionsByName {
  constructor(regionRepository) {
    this.regionRepository = regionRepository;
  }

  async execute(searchParams) {
    const {
      partialName,
      page = 1,
      pageSize = 10,
      country = null,
      sortBy = 'population'
    } = searchParams;

    // Validate the partialName input
    if (
      // eslint-disable-next-line security/detect-unsafe-regex -- Validated safe regex for search term validation
      !/^(?=.{1,50}$)(?!.*\s{2,})(?!.*[.,'`-]{2,})[\p{L}0-9](?:[\p{L}0-9\s.,'`-]*[\p{L}0-9])?$/u.test(
        partialName.trim()
      )
    ) {
      throw new Error('InvalidSearchTermError');
    }

    if (country && country.trim() && !/^[a-zA-Z]{2}$/.test(country.trim())) {
      throw new Error('InvalidCountryCodeError');
    }

    const breaker = getCircuitBreakerInstance(
      this.regionRepository.searchByName.bind(this.regionRepository),
      Config.getInstance().db.mongo.name
    );

    try {
      const searchOptions = {
        partialName: partialName.trim().toLowerCase(),
        page: Math.max(1, parseInt(page)),
        pageSize: Math.min(Math.max(1, parseInt(pageSize)), 50),
        country,
        sortBy
      };

      const { results, totalCount } = await breaker.fire(searchOptions);

      // Extract unique country codes from results
      const countryCodes = [
        ...new Set(
          results.map(city => city.country.toLowerCase()).filter(code => code)
        )
      ];

      const restCountriesBreaker = getCircuitBreakerInstance(
        this._fetchCountriesData.bind(this),
        Config.getInstance().apis.restCountries.name
      );

      // Create countries lookup object to avoid duplication
      const countries = {};

      if (countryCodes && countryCodes.length > 0) {
        const countriesData = await restCountriesBreaker.fire(countryCodes);
        if (countriesData.length > 0) {
          // Build countries lookup object
          countriesData.forEach(countryData => {
            countries[countryData.code] = {
              name: countryData.name ?? 'Unknown',
              flagUrl: countryData.flags?.svg ?? null,
              mapUrl: countryData.maps?.openStreetMaps ?? null,
              region: countryData.region ?? 'unknown',
              subregion: countryData.subregion ?? 'unknown'
            };
          });

          // Update cities with country codes only
          results.forEach(city => {
            const countryCode = city.country.toLowerCase();
            city.countryCode = countryCode;
            // eslint-disable-next-line security/detect-object-injection -- Safe access with validated country codes
            city.country = countries[countryCode]?.name ?? 'Unknown';
          });
        } else {
          throw new Error('CountryNotFoundError');
        }
      }

      return {
        success: true,
        searchTerm: partialName,
        pagination: {
          currentPage: searchOptions.page,
          pageSize: searchOptions.pageSize,
          totalItems: totalCount,
          totalPages: Math.ceil(totalCount / searchOptions.pageSize)
        },
        countries,
        suggestions: results.map(
          city =>
            new Region(city.id, city.name, city.state, city.countryCode, city.coord)
        )
      };
    } catch {
      throw new Error('RegionSearchError');
    }
  }

  async _fetchCountriesData(countryCodes) {
    // has to be fetched using restcountries API with full promise support
    if (!Array.isArray(countryCodes) || countryCodes.length === 0) {
      throw new Error('Country codes must be a non-empty array');
    }
    const promises = countryCodes.map(code => {
      if (!/^[a-zA-Z]{2}$/.test(code)) {
        throw new Error(`Invalid country code: ${code}`);
      }
      return RestCountries.getCountryByCode(code);
    });
    return Promise.all(promises).then(countries => {
      return countries.map(country => {
        const data = country.data[0];
        return {
          code: data?.cca2.toLowerCase(),
          name: data?.name.common.toLowerCase() ?? 'unknown',
          population: data?.population ?? 0,
          region: data?.region.toLowerCase() ?? 'unknown',
          subregion: data?.subregion.toLowerCase() ?? 'unknown',
          capital: data?.capital ? data?.capital[0] : null,
          flags: {
            png: data?.flags.png ?? null,
            svg: data?.flags.svg ?? null,
            alt: data?.flags.alt ?? `Flag of ${data?.name.common}`
          },
          maps: data?.maps ?? null
        };
      });
    });
  }
}
