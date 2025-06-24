import RegionRepository from '../../domain/repositories/RegionRepository.js';

import { Regions } from './RegionSchema.js';

export class RegionRepositoryImpl extends RegionRepository {
  constructor() {
    super();
  }
  async get10Regions() {
    return Regions.find().limit(10).exec();
  }

  async searchByName({
    partialName,
    country,
    minPopulation,
    page,
    pageSize,
    sortBy
  }) {
    if (!partialName || typeof partialName !== 'string' || partialName.length < 2) {
      throw new Error('Partial name must be at least 2 characters');
    }

    try {
      const query = {
        name: { $regex: partialName, $options: 'i' },
        'stat.population': { $gte: minPopulation }
      };

      if (country) {
        query.country = country;
      }

      const projection = {
        _id: 0,
        id: 1,
        name: 1,
        country: 1,
        coord: 1,
        'stat.population': 1,
        zoom: 1
      };

      // Get total count for pagination
      const totalCount = await Regions.countDocuments(query);

      // Calculate skip value
      const skip = (page - 1) * pageSize;

      // Determine sort order
      const sortOrder = {};
      if (sortBy === 'population') {
        sortOrder['stat.population'] = -1;
      } else {
        sortOrder.name = 1; // Default sort by name ascending
      }

      const results = await Regions.find(query)
        .select(projection)
        .sort(sortOrder)
        .skip(skip)
        .limit(pageSize)
        .lean()
        .exec();

      return {
        results: results.map(city => ({
          ...city,
          displayName: this._getDisplayName(city),
          location: city.coord
            ? {
                longitude: city.coord.lon,
                latitude: city.coord.lat
              }
            : null
        })),
        totalCount
      };
    } catch (error) {
      console.debug('Search failed:', error);
      throw new Error('Failed to search cities');
    }
  }

  // Helper function to get the best display name from langs array
  _getDisplayName(city) {
    if (!city.langs || city.langs.length === 0) return city.name;

    // Prefer English name if available
    const enName = city.langs.find(lang => lang.en);
    if (enName) return enName.en;

    // Return the first alternative name
    const firstLang = city.langs[0];
    return firstLang[Object.keys(firstLang)[0]] || city.name;
  }
}
