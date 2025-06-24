/**
 * Database failover implementation for handling database connection failures
 * @module DatabaseFailover
 */

import config from '../config/Config.js';

/**
 * DatabaseFailover class for managing database connections with failover capabilities
 * Implements backup data sources and graceful degradation for database operations
 */
class DatabaseFailover {
  /**
   * Creates a new DatabaseFailover instance
   * @param {Object} options - Configuration options
   * @param {Object} options.primaryConfig - Primary database configuration
   * @param {Object} options.backupConfig - Backup database configuration (optional)
   * @param {Function} options.connectFn - Function to connect to database
   * @param {boolean} options.enableCircuitBreaker - Whether to enable circuit breaker (default: true)
   */
  constructor(options = {}) {
    this.primaryConfig = options.primaryConfig || config.getInstance().db;
    this.backupConfig = options.backupConfig || config.getInstance().backupDb;
    this.connectFn = options.connectFn;
    this.isUsingBackup = false;
    this.lastError = null;

    console.debug('Database failover initialized');
  }

  /**
   * Connects to the primary database with failover capabilities
   * @returns {Promise<boolean>} - True if connection successful
   * @throws {Error} - If all connection attempts fail
   */
  async connect() {
    try {
      return await this._connectToPrimary();
    } catch (error) {
      console.debug('Failed to connect to any database', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Connects to the primary database
   * @returns {Promise<boolean>} - True if connection successful
   * @private
   */
  async _connectToPrimary() {
    try {
      console.debug('Attempting to connect to primary database');

      if (!this.connectFn) {
        throw new Error('No database connection function provided');
      }

      const result = await this.connectFn();

      if (this.isUsingBackup) {
        console.debug('Successfully reconnected to primary database');
        this.isUsingBackup = false;
      }

      return result;
    } catch (error) {
      this.lastError = error;
      console.debug('Failed to connect to primary database', {
        error: error.message,
        stack: error.stack
      });

      throw error;
    }
  }

  /**
   * Connects to the backup database
   * @returns {Promise<boolean>} - True if connection successful
   * @throws {Error} - If backup connection fails or no backup is configured
   * @private
   */
  async _connectToBackup() {
    if (!this.backupConfig) {
      console.debug('No backup database configured');
      throw new Error(
        'No backup database configured and primary database is unavailable'
      );
    }

    try {
      console.debug('Attempting to connect to backup database');

      // Store original config
      const originalConfig = { ...config.getInstance().db };

      // Temporarily replace with backup config
      Object.assign(config.getInstance().db, this.backupConfig);

      // Connect using the same function but with backup config
      const result = await this.connectFn();

      // Mark that we're using backup
      this.isUsingBackup = true;

      console.debug('Successfully connected to backup database');

      // Schedule attempt to reconnect to primary
      this._scheduleReconnectToPrimary();

      return result;
    } catch (error) {
      console.debug('Failed to connect to backup database', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Schedules an attempt to reconnect to the primary database
   * @private
   */
  _scheduleReconnectToPrimary() {
    const reconnectInterval = this.primaryConfig.reconnectInterval || 60000; // 1 minute

    console.debug(
      `Scheduling reconnect to primary database in ${reconnectInterval}ms`
    );

    setTimeout(async () => {
      try {
        // If circuit breaker is enabled, reset it to allow reconnection attempt
        if (this.enableCircuitBreaker) {
          this.circuitBreaker.reset();
        }

        await this._connectToPrimary();
      } catch (error) {
        // If reconnection fails, schedule another attempt
        this._scheduleReconnectToPrimary();
      }
    }, reconnectInterval);
  }

  /**
   * Checks if the system is currently using the backup database
   * @returns {boolean} - True if using backup database
   */
  isUsingBackupDatabase() {
    return this.isUsingBackup;
  }

  /**
   * Gets the last error that occurred during connection attempts
   * @returns {Error|null} - Last error or null
   */
  getLastError() {
    return this.lastError;
  }
}

export default DatabaseFailover;
