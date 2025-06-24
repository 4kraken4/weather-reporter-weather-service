/* eslint-disable no-console */
import express from 'express';

import { connectWithResilience } from '../db/mongoose.js';

import Config from './config/Config.js';
import errorHandler from './infrastructure/middlewares/errorHandler.js';
import router from './interfaces/http/routes/routes.js';

const serviceConfig = Config.getInstance().service;
const service = express();

service.disable('x-powered-by');
service.disable('etag');
service.use(express.json());
service.use(express.urlencoded({ extended: true }));
service.use(`/${serviceConfig.routePrefix}`, router);
service.use(errorHandler);

service.listen(serviceConfig.port, async () => {
  await connectWithResilience();
  console.log(
    `Server is running on ${serviceConfig.protocol}://${serviceConfig.host}:${serviceConfig.port}`
  );
});
