/**
 * Helper functions for database connection management
 * @module connectionHelpers
 */

import config from '../src/config/Config.js';
import { DatabaseConnectionError } from '../src/infrastructure/errors/index.js';

/**
 * Retries a database connection function after a delay
 * @param {Function} connectionFn - The connection function to retry
 * @param {string} errorContext - Context information for error messages
 * @param {string} errorCode - Error code for the DatabaseConnectionError
 * @returns {Promise<boolean>} A promise that resolves to true when the connection is established
 * @throws {DatabaseConnectionError} If the connection fails after retry
 */
const retryConnection = async (connectionFn, errorContext, errorCode) => {
  try {
    await new Promise((resolve, reject) => {
      setTimeout(() => {
        connectionFn().then(resolve).catch(reject);
      }, 5000);
    });

    return true;
  } catch (retryError) {
    throw new DatabaseConnectionError(
      `Failed to establish database connection after retry (${errorContext})`,
      errorCode,
      { originalError: retryError.message }
    );
  }
};

/**
 * Waits for the database connection to be established.
 * @param {Object} mongoose - The mongoose instance
 * @param {number} retries - The number of retries to attempt.
 * @returns {Promise<boolean>} A promise that resolves to true when the connection is established.
 * @throws {DatabaseConnectionError} If the connection fails after retries.
 */
const waitForConnection = async (
  mongoose,
  retries = config.getInstance().db.mongo.maxReconnectAttempts || 5
) => {
  try {
    const reconnectInterval = config.getInstance().db.mongo.reconnectInterval || 2000;

    let attempt = 0;

    const checkConnection = async () => {
      // Check if already connected
      if (mongoose.connection.readyState === 1) {
        return true;
      }
      attempt++;

      if (attempt >= retries) {
        return false;
      }

      // Wait before next attempt
      await new Promise(resolve => {
        setTimeout(resolve, reconnectInterval);
      });
      return checkConnection();
    };

    if (!(await checkConnection())) {
      // If exhausted all retries
      throw new DatabaseConnectionError(
        `Failed to establish database connection after ${retries} attempts`,
        'DB_CONNECTION_TIMEOUT',
        { retries, reconnectInterval }
      );
    }

    return true;
  } catch (error) {
    // If it's a custom error, rethrow
    if (error instanceof DatabaseConnectionError) {
      throw error;
    }
    throw new DatabaseConnectionError(
      'Error while waiting for database connection',
      'DB_CONNECTION_WAIT_ERROR',
      { originalError: error.message }
    );
  }
};

/**
 * Verifies that the database connection is established.
 * If not, waits for the connection to be established.
 * @param {Object} mongoose - The mongoose instance
 * @returns {Promise<boolean>} A promise that resolves to true when the connection is verified.
 * @throws {DatabaseConnectionError} If the connection fails after retries.
 */
const verifyDatabaseConnection = async mongoose => {
  try {
    // Check if already connected
    if (mongoose.connection.readyState === 1) {
      return true;
    }
    return await waitForConnection(mongoose);
  } catch (error) {
    // If it's already our custom error, just rethrow it
    if (error instanceof DatabaseConnectionError) {
      throw error;
    }
    throw new DatabaseConnectionError(
      'Error verifying database connection',
      'DB_CONNECTION_VERIFICATION_ERROR',
      { originalError: error.message }
    );
  }
};

export { retryConnection, verifyDatabaseConnection, waitForConnection };
