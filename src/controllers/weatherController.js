import GetCurrentWeatherForRegion from '../domain/usecases/GetCurrentWeatherForRegion.js';
import SearchRegionsByName from '../domain/usecases/SearchRegionsByName.js';
import { RegionRepositoryImpl } from '../infrastructure/orm/RegionRepositoryImpl.js';

const weatherController = {
  searchRegionsByName: async (req, res, next) => {
    try {
      const {
        q: searchTerm,
        country,
        minPopulation,
        page = 1,
        pageSize = 10
      } = req.query;
      if (!searchTerm) {
        return res.status(400).json({
          success: false,
          message: 'Search term (q) is required'
        });
      }
      const regionRepository = new RegionRepositoryImpl();
      const searchCitiesByName = new SearchRegionsByName(regionRepository);
      const regions = await searchCitiesByName.execute({
        partialName: searchTerm,
        country,
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
  }
};

export default weatherController;
