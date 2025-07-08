import RegionRepository from '../../domain/repositories/RegionRepository.js';

import { Regions } from './RegionSchema.js';

export class RegionRepositoryImpl extends RegionRepository {
  async getRegionFromName(regionName, countryCode) {
    return Regions.findOne({
      name: { $regex: new RegExp(regionName, 'i') },
      country: countryCode
    })
      .lean()
      .exec();
  }

  async searchByName({ partialName, country, page, pageSize, sortBy }) {
    // Build base query with required filters
    const query = {};

    // Add partial name filter if provided
    if (partialName && partialName.trim()) {
      query.name = { $regex: partialName.trim(), $options: 'i' };
    }

    // Add country filter if provided (case-insensitive for flexibility)
    if (country && country.trim()) {
      query.country = { $regex: new RegExp(`^${country.trim()}$`, 'i') };
    }

    const projection = {
      _id: 0,
      id: 1,
      name: 1,
      state: 1,
      country: 1,
      coord: 1,
      zoom: 1
    };

    // Get total count for pagination
    const totalCount = await Regions.countDocuments(query);

    // Calculate skip value
    const skip = (page - 1) * pageSize;

    // Determine sort order
    const sortOrder = {};
    if (sortBy === 'name') {
      sortOrder.name = 1;
    } else {
      sortOrder.name = -1;
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
          ? { longitude: city.coord.lon, latitude: city.coord.lat }
          : null
      })),
      totalCount
    };
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
