export default class GetGeoSpatialData {
  constructor(geoSpatialRepository) {
    this.geoSpatialRepository = geoSpatialRepository;
  }

  async execute(region) {
    if (!region) {
      throw new Error('RegionNotProvidedForGeoError');
    }
    const data = await this.geoSpatialRepository.getData(region);
    return data;
  }
}
