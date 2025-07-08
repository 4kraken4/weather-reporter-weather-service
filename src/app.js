import express from 'express';

import { connectWithResilience } from '../db/mongoose.js';

import Config from './config/Config.js';
import errorHandler from './infrastructure/middlewares/errorHandler.js';
import router from './interfaces/http/routes/routes.js';
import { createModuleLogger } from './utils/Logger.js';
import UrlUtils from './utils/UrlUtils.js';

const logger = createModuleLogger('App');

const serviceConfig = Config.getInstance().service;
const service = express();

service.disable('x-powered-by');
service.disable('etag');
service.use(express.json());
service.use(express.urlencoded({ extended: true }));

service.use(`/${serviceConfig.routePrefix}`, router);
service.use(errorHandler);

// Only initialize database connection if not in test environment

if (process.env.NODE_ENV !== 'test') {
  // Initialize database connection
  connectWithResilience()
    .then(() => {
      logger.info('Database connected successfully');
    })
    .catch(error => {
      logger.error('Database connection failed:', error);
    });
}

// For local development only - don't start server during tests
if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
  service.listen(serviceConfig.port, () => {
    const serverUrl = UrlUtils.buildServiceBaseUrl(serviceConfig, false);
    logger.info(`Server is running on ${serverUrl}`);
  });
}

export default service;
