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

// Initialize database connection
connectWithResilience()
  .then(() => {
    console.log('Database connected successfully');
  })
  .catch(error => {
    console.error('Database connection failed:', error);
  });

// For local development only
// eslint-disable-next-line no-undef
if (process.env.NODE_ENV !== 'production') {
  service.listen(serviceConfig.port, () => {
    console.log(
      `Server is running on ${serviceConfig.protocol}://${serviceConfig.host}${serviceConfig.protocol === 'https' ? '' : `:${serviceConfig.port}`}`
    );
  });
}

export default service;
