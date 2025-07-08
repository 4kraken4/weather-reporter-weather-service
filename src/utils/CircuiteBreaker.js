import CircuitBreaker from 'opossum';

import Config from '../config/Config.js';

import { createModuleLogger } from './Logger.js';

const logger = createModuleLogger('Circuit Breaker');

const breakerInstances = {};
// Pre-populate with known services from config to avoid object injection issues
Object.keys(Config.getInstance().db).forEach(service => {
  // Safe assignment - service keys come from config
  // eslint-disable-next-line security/detect-object-injection
  breakerInstances[service] = null;
});

Object.keys(Config.getInstance().apis).forEach(service => {
  // Safe assignment - service keys come from config
  // eslint-disable-next-line security/detect-object-injection
  breakerInstances[service] = null;
});

export function getCircuitBreakerInstance(action = null, service) {
  if (!service) {
    throw new Error('Service name is required to get a circuit breaker instance.');
  }

  // Validate service exists in config to prevent object injection
  const config = Config.getInstance();
  const validServices = [...Object.keys(config.db), ...Object.keys(config.apis)];
  if (!validServices.includes(service)) {
    throw new Error(
      `Invalid service name: ${service}. Valid services: ${validServices.join(', ')}`
    );
  }

  const serviceLabel = service.charAt(0).toUpperCase() + service.slice(1);

  // Safe object access - service is validated against known config
  // eslint-disable-next-line security/detect-object-injection
  if (!breakerInstances[service]) {
    const options = {
      errorThresholdPercentage: 80,
      timeout: 4000,
      resetTimeout: 10000,
      rollingCountTimeout: 10000,
      rollingCountBuckets: 10,
      name: service,
      errorFilter: error => {
        const err = !error?.response ? error?.code : error?.response?.status;
        if (
          err === 'ECONNABORTED' ||
          err === 'ECONNREFUSED' ||
          err === 'EOPENBREAKER' ||
          err >= 500 ||
          err === 429
        ) {
          return false;
        }
        return true;
      }
    };

    // eslint-disable-next-line security/detect-object-injection
    breakerInstances[service] = new CircuitBreaker(action, options);

    // eslint-disable-next-line security/detect-object-injection
    breakerInstances[service].on('open', () => {
      logger.warn(
        `${serviceLabel} circuit breaker is open, requests are being blocked`
      );
    });

    // eslint-disable-next-line security/detect-object-injection
    breakerInstances[service].on('halfOpen', () => {
      logger.info(
        `${serviceLabel} circuit breaker is half-open, requests are being tested`
      );
    });

    // eslint-disable-next-line security/detect-object-injection
    breakerInstances[service].on('close', () => {
      logger.info(`${serviceLabel} circuit breaker is closed, requests are allowed`);
    });

    // eslint-disable-next-line security/detect-object-injection
    breakerInstances[service].on('fire', () => {
      // eslint-disable-next-line security/detect-object-injection
      if (breakerInstances[service].opened) {
        throw new Error('CircuitBreakerOpenError');
      }
    });

    // eslint-disable-next-line security/detect-object-injection
    breakerInstances[service].on('failure', error => {
      const errorResponse =
        error?.response?.data?.error?.error ||
        error?.response?.data?.error ||
        error.code;
      const finalError = errorResponse || error;
      logger.error(`${serviceLabel} circuit breaker failure:`, finalError);
    });
  }

  // eslint-disable-next-line security/detect-object-injection
  breakerInstances[service].action = action
    ? action
    : breakerInstances[service].action; // eslint-disable-line security/detect-object-injection

  // eslint-disable-next-line security/detect-object-injection
  return breakerInstances[service];
}
