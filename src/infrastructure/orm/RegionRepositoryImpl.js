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
    const match = {};

    // Add partial name filter if provided
    if (partialName && partialName.trim()) {
      match.name = { $regex: partialName.trim(), $options: 'i' };
    }

    // Add country filter if provided (case-insensitive for flexibility)
    if (country && country.trim()) {
      match.country = { $regex: new RegExp(`^${country.trim()}$`, 'i') };
    }

    // Determine sort order
    const sortOrder = sortBy === 'name' ? 1 : -1;

    // Aggregation pipeline to get unique names only
    const pipeline = [
      { $match: match },
      {
        $group: {
          _id: { name: '$name', country: '$country', state: '$state' },
          doc: { $first: '$$ROOT' },
          count: { $sum: 1 }
        }
      },
      { $replaceRoot: { newRoot: '$doc' } },
      { $sort: { name: sortOrder } },
      { $skip: (page - 1) * pageSize }, // Calculate skip value
      { $limit: pageSize },
      {
        $project: {
          _id: 0,
          id: 1,
          name: 1,
          state: 1,
          country: 1,
          coord: 1,
          zoom: 1
        }
      }
    ];

    // Get total count of unique names
    const countPipeline = [
      { $match: match },
      {
        $group: {
          _id: '$name',
          count: { $sum: 1 }
        }
      },
      { $match: { count: 1 } },
      { $count: 'totalCount' }
    ];

    const [results, countResult] = await Promise.all([
      Regions.aggregate(pipeline).allowDiskUse(true).exec(),
      Regions.aggregate(countPipeline).allowDiskUse(true).exec()
    ]);

    // Get total count for pagination
    const totalCount = countResult[0]?.totalCount || 0;

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
