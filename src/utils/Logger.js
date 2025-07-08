/**
 * Central Logger utility for the entire application
 * Provides consistent logging across all modules with configurable levels and formats
 */

import Config from '../config/Config.js';

class Logger {
  constructor() {
    this.config = Config.getInstance();
    this.logLevel = this.getLogLevel();
    this.enabledInProduction = this.config.logging?.enabledInProduction !== false;

    // Log levels in order of priority
    this.levels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3
    };
  }

  getLogLevel() {
    // Priority: ENV variable > config > default
    if (process.env.LOG_LEVEL) {
      return process.env.LOG_LEVEL.toLowerCase();
    }
    return this.config.logging?.level || 'info';
  }

  shouldLog(level) {
    const currentLevelPriority = this.levels[this.logLevel] || this.levels.info;
    // Safe access - level is controlled by internal methods
    // eslint-disable-next-line security/detect-object-injection
    const messageLevelPriority = this.levels[level] || this.levels.info;

    // Always log in development, check config for production
    const isProduction = process.env.NODE_ENV === 'production';
    if (isProduction && !this.enabledInProduction) {
      return false;
    }

    return messageLevelPriority <= currentLevelPriority;
  }

  formatMessage(level, module, message, ...args) {
    const timestamp = new Date().toISOString();
    const modulePrefix = module ? `[${module}]` : '';
    const levelPrefix = `[${level.toUpperCase()}]`;

    return {
      formatted: `${timestamp} ${levelPrefix} ${modulePrefix} ${message}`,
      args
    };
  }

  /**
   * Log error messages (always logged unless completely disabled)
   */
  error(module, message, ...args) {
    if (this.shouldLog('error')) {
      const { formatted, args: logArgs } = this.formatMessage(
        'error',
        module,
        message,
        ...args
      );
      // eslint-disable-next-line no-console
      console.error(formatted, ...logArgs);
    }
  }

  /**
   * Log warning messages
   */
  warn(module, message, ...args) {
    if (this.shouldLog('warn')) {
      const { formatted, args: logArgs } = this.formatMessage(
        'warn',
        module,
        message,
        ...args
      );
      // eslint-disable-next-line no-console
      console.warn(formatted, ...logArgs);
    }
  }

  /**
   * Log info messages
   */
  info(module, message, ...args) {
    if (this.shouldLog('info')) {
      const { formatted, args: logArgs } = this.formatMessage(
        'info',
        module,
        message,
        ...args
      );
      // eslint-disable-next-line no-console
      console.log(formatted, ...logArgs);
    }
  }

  /**
   * Log debug messages (only in debug level)
   */
  debug(module, message, ...args) {
    if (this.shouldLog('debug')) {
      const { formatted, args: logArgs } = this.formatMessage(
        'debug',
        module,
        message,
        ...args
      );
      // eslint-disable-next-line no-console
      console.debug(formatted, ...logArgs);
    }
  }

  /**
   * Create a module-specific logger
   */
  module(moduleName) {
    return {
      error: (message, ...args) => this.error(moduleName, message, ...args),
      warn: (message, ...args) => this.warn(moduleName, message, ...args),
      info: (message, ...args) => this.info(moduleName, message, ...args),
      debug: (message, ...args) => this.debug(moduleName, message, ...args)
    };
  }

  /**
   * Log HTTP requests (special method for middleware)
   */
  http(method, url, status, duration, ...args) {
    const message = `${method} ${url} ${status} - ${duration}ms`;
    if (status >= 500) {
      this.error('HTTP', message, ...args);
    } else if (status >= 400) {
      this.warn('HTTP', message, ...args);
    } else {
      this.info('HTTP', message, ...args);
    }
  }

  /**
   * Log database operations
   */
  db(operation, collection, duration, ...args) {
    const message = `${operation} ${collection} - ${duration}ms`;
    this.debug('DATABASE', message, ...args);
  }

  /**
   * Log cache operations
   */
  cache(operation, key, hit = null, ...args) {
    let hitStatus = '';
    if (hit !== null) {
      hitStatus = hit ? 'HIT' : 'MISS';
    }
    const message = `${operation} ${key} ${hitStatus}`.trim();
    this.debug('CACHE', message, ...args);
  }

  /**
   * Log circuit breaker events
   */
  circuit(service, state, ...args) {
    const message = `Circuit breaker ${state} for ${service}`;
    if (state === 'open') {
      this.warn('CIRCUIT', message, ...args);
    } else {
      this.info('CIRCUIT', message, ...args);
    }
  }

  /**
   * Log API calls to external services
   */
  api(service, endpoint, method, status, duration, ...args) {
    const message = `${service} ${method} ${endpoint} ${status} - ${duration}ms`;
    if (status >= 500) {
      this.error('API', message, ...args);
    } else if (status >= 400) {
      this.warn('API', message, ...args);
    } else {
      this.info('API', message, ...args);
    }
  }
}

// Create and export a singleton logger instance
const logger = new Logger();

export default logger;

// Export convenience methods for direct use
export const { error, warn, info, debug, http, db, cache, circuit, api } = logger;

// Export module creator for scoped logging
export const createModuleLogger = moduleName => logger.module(moduleName);
