import axios from 'axios';
import retry from 'retry';

import { createModuleLogger } from '../../utils/Logger.js';

const logger = createModuleLogger('HttpClient');

class HttpClient {
  constructor(baseURL) {
    this.client = axios.create({
      baseURL,
      timeout: 10000 // If our function takes longer than 10 seconds, trigger a failure.
    });
  }

  // Helper method to wrap retry logic
  async retryOperation(fn, options = { retries: 0, factor: 2, minTimeout: 1000 }) {
    return new Promise((resolve, reject) => {
      const operation = retry.operation(options);
      operation.attempt(async currentAttempt => {
        try {
          const result = await fn();
          resolve(result); // Resolve if successful
        } catch (error) {
          // Retry only on network errors
          let currentError = error;
          while (currentError.response) {
            if (currentError?.response) currentError = currentError.response;
          }
          currentError = currentError.data?.error;

          const errorCode = !error?.response ? error.code : error.response.status;
          if (
            currentError?.error === 'CircuitBreakerOpenError' ||
            currentError?.error === 'SequelizeConnectionRefusedError'
          ) {
            return reject(error);
          }
          if (
            errorCode === 'ECONNABORTED' ||
            errorCode === 'ECONNREFUSED' ||
            errorCode >= 500 ||
            errorCode === 429
          ) {
            if (operation.retry(error)) {
              logger.debug(`Retry attempt #${currentAttempt} failed, retrying...`);
              if (currentAttempt === options.retries) {
                reject(error);
              }
              return;
            }
          }
          reject(error); // Reject if unsuccessful
        }
      });
    });
  }

  async get(url, config = {}) {
    // If url is absolute, use it directly; if relative, use with baseURL
    const requestConfig = url.startsWith('http')
      ? { ...config, baseURL: '' }
      : config;
    return this.retryOperation(() => this.client.get(url, requestConfig));
  }

  async post(url, data, config = {}) {
    return this.retryOperation(() => this.client.post(url, data, config));
  }

  async put(url, data, config = {}) {
    return this.retryOperation(() => this.client.put(url, data, config));
  }

  async delete(url, config = {}) {
    return this.retryOperation(() => this.client.delete(url, config));
  }
}

export default HttpClient;
