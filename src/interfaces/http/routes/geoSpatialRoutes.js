import { Router } from 'express';

import geoSpatialDataController from '../../../controllers/geoSpatialDataController.js';

export const geoRouter = Router();

geoRouter.get('/:region', geoSpatialDataController.getGeoSpatialData);
