import { Router } from 'express';

import config from '../../../config/Config.js';

import { weatherRouter } from './weatherRoutes.js';

const router = Router();

router.get('/health', (_, res) => {
  res.json({
    service: config.getInstance().service.name,
    version: config.getInstance().service.version,
    date: new Date().toUTCString()
  });
});

router.use('/', weatherRouter);

export default router;
