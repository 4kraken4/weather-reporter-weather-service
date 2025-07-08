import { Router } from 'express';

import weatherController from '../../../controllers/weatherController.js';

export const weatherRouter = Router();

weatherRouter.get('/current/:cityId', weatherController.getCurrentWeather);
weatherRouter.get('/current', weatherController.getCurrentWeatherByRegionName);
weatherRouter.get('/search', weatherController.searchRegionsByName);
weatherRouter.post('/bulk', weatherController.getBulkWeather);
