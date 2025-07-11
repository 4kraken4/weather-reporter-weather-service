import GetBulkWeatherData from '../domain/usecases/GetBulkWeatherData.js';
import GetCurrentWeatherByRegionName from '../domain/usecases/GetCurrentWeatherByRegionName.js';
import GetCurrentWeatherForRegion from '../domain/usecases/GetCurrentWeatherForRegion.js';
import SearchRegionsByName from '../domain/usecases/SearchRegionsByName.js';
import { RegionRepositoryImpl } from '../infrastructure/orm/RegionRepositoryImpl.js';

const weatherController = {
  searchRegionsByName: async (req, res, next) => {
    try {
      const {
        q: searchTerm,
        country,
        code,
        minPopulation,
        page = 1,
        pageSize = 10
      } = req.query;
      const regionRepository = new RegionRepositoryImpl();
      const searchCitiesByName = new SearchRegionsByName(regionRepository);
      const regions = await searchCitiesByName.execute({
        partialName: searchTerm,
        country: country || code,
        minPopulation: minPopulation ? parseInt(minPopulation) : 0,
        page: parseInt(page),
        pageSize: Math.min(parseInt(pageSize), 20),
        sortBy: 'population'
      });
      res.status(200).json(regions);
    } catch (error) {
      next(error);
    }
  },
  getCurrentWeather: async (req, res, next) => {
    try {
      const regionRepository = new RegionRepositoryImpl();
      const getCurrentWeatherForRegion = new GetCurrentWeatherForRegion(
        regionRepository
      );
      const { cityId } = req.params;
      const weatherData = await getCurrentWeatherForRegion.execute(cityId);
      res.status(200).json(weatherData);
    } catch (error) {
      next(error);
    }
  },
  getCurrentWeatherByRegionName: async (req, res, next) => {
    try {
      const { region, code } = req.query;
      const regionRepository = new RegionRepositoryImpl();
      const getCurrentWeatherByRegionName = new GetCurrentWeatherByRegionName(
        regionRepository
      );
      const weatherData = await getCurrentWeatherByRegionName.execute(region, code);
      res.status(200).json(weatherData);
    } catch (error) {
      next(error);
    }
  },
  getBulkWeather: async (req, res, next) => {
    try {
      const { cities } = req.body;

      if (!cities || !Array.isArray(cities)) {
        throw new Error('BulkWeatherArrayNotProvidedError');
      }

      if (cities.length === 0) {
        throw new Error('NoCitiesProvidedError');
      }

      if (cities.length > 15) {
        throw new Error('TooManyCitiesError');
      }

      const getBulkWeatherData = new GetBulkWeatherData();
      const result = await getBulkWeatherData.execute(cities);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
};

export default weatherController;
