import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const GeonameSchema = new Schema({
  cl: { type: String },
  code: { type: String },
  parent: { type: Number }
});

const StatSchema = new Schema({
  level: { type: Number },
  population: { type: Number }
});

const LangSchema = new Schema({}, { strict: false });

const StationSchema = new Schema({
  id: { type: Number },
  dist: { type: Number },
  kf: { type: Number }
});

export const RegionSchema = new Schema({
  id: { type: Number, required: true, unique: true },
  coord: {
    lon: { type: Number },
    lat: { type: Number }
  },
  country: { type: String },
  geoname: GeonameSchema,
  langs: [LangSchema],
  name: { type: String },
  stat: StatSchema,
  stations: [StationSchema],
  zoom: { type: Number }
});

RegionSchema.index({ 'coord.lon': 1, 'coord.lat': 1 });
RegionSchema.index({ name: 'text', country: 'text' });
RegionSchema.index({ 'geoname.code': 1, 'geoname.cl': 1 });
RegionSchema.index({ 'geoname.parent': 1 });

export const Regions = mongoose.model('Regions', RegionSchema, 'Regions');
