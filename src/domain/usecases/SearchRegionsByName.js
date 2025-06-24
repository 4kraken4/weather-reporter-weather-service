import Config from '../../config/Config.js';
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
      minPopulation = 0,
      countryCode = null,
      sortBy = 'population'
    } = searchParams;

    // Validate input
    if (!partialName || typeof partialName !== 'string' || partialName.length < 2) {
      throw new Error('InvalidSearchTermError');
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
        minPopulation,
        countryCode,
        sortBy
      };

      const { results, totalCount } = await breaker.fire(searchOptions);

      return {
        success: true,
        searchTerm: partialName,
        pagination: {
          currentPage: searchOptions.page,
          pageSize: searchOptions.pageSize,
          totalItems: totalCount,
          totalPages: Math.ceil(totalCount / searchOptions.pageSize)
        },
        suggestions: results.map(city => Region.fromJson(city))
      };
    } catch {
      throw new Error('RegionSearchError');
    }
  }
}
