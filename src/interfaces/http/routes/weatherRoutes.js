import { Router } from 'express';

import weatherController from '../../../controllers/weatherController.js';

export const weatherRouter = Router();

weatherRouter.get('/search', weatherController.searchRegionsByName);
weatherRouter.get('/current/:cityId', weatherController.getCurrentWeather);
