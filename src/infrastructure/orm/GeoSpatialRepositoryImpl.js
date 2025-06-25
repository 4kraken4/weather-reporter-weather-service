import { mongoose } from '../../../db/mongoose.js';
import GeoSpatilRepository from '../../domain/repositories/GeoSpatilRepository.js';

const geoSpatialSchema = new mongoose.Schema(
  {},
  { strict: false, collection: 'GeoSpatialData' }
);
const GeoSpatialModel = mongoose.model('GeoSpatialData', geoSpatialSchema);

export default class GeoSpatialRepositoryImpl extends GeoSpatilRepository {
  constructor() {
    super();
  }

  async getData(region) {
    const query = region ? { region: region } : {};

    const data = await GeoSpatialModel.find(query)
      .select('properties geometry')
      .lean()
      .exec();
    return data;
  }
}
