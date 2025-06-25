import GetGeoSpatialData from '../domain/usecases/GetGeoSpatialData.js';
import GeoSpatialRepositoryImpl from '../infrastructure/orm/GeoSpatialRepositoryImpl.js';

const geoSpatialDataController = {
  getGeoSpatialData: async (req, res, next) => {
    try {
      const { region } = req.params;
      const geoSpatialRepository = new GeoSpatialRepositoryImpl();
      const getGeoSpatialData = new GetGeoSpatialData(geoSpatialRepository);
      const data = await getGeoSpatialData.execute(region);
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  }
};

export default geoSpatialDataController;
