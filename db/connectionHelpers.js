/**
 * Helper functions for database connection management
 * @module connectionHelpers
 */

import config from '../src/config/Config.js'
import { DatabaseConnectionError } from '../src/infrastructure/errors/index.js'

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
    console.debug(`Retrying ${errorContext} in 5 seconds...`)

    await new Promise((resolve, reject) => {
      setTimeout(() => {
        connectionFn().then(resolve).catch(reject)
      }, 5000)
    })

    return true
  } catch (retryError) {
    console.debug(`Database connection retry failed (${errorContext})`, {
      error: retryError.message,
      stack: retryError.stack
    })

    throw new DatabaseConnectionError(
      `Failed to establish database connection after retry (${errorContext})`,
      errorCode,
      { originalError: retryError.message }
    )
  }
}

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
    console.debug(
      `Waiting for database connection (max ${retries} attempts)`
    )

    const reconnectInterval = config.getInstance().db.mongo.reconnectInterval || 2000

    for (let i = 0; i < retries; i++) {
      // Check if already connected
      if (mongoose.connection.readyState === 1) {
        console.debug('Database connection verified')
        return true
      }

      // Log retry attempt
      if (i > 0) {
        console.debug(`Connection attempt ${i + 1}/${retries}`)
      }

      // Wait before next attempt
      await new Promise((resolve) => setTimeout(resolve, reconnectInterval))
    }

    // If exhausted all retries
    console.debug(
      `Failed to establish database connection after ${retries} attempts`
    )
    // noinspection ExceptionCaughtLocallyJS
    throw new DatabaseConnectionError(
      `Failed to establish database connection after ${retries} attempts`,
      'DB_CONNECTION_TIMEOUT',
      { retries, reconnectInterval }
    )
  } catch (error) {
    // If it's a custom error, rethrow
    if (error instanceof DatabaseConnectionError) {
      throw error
    }

    // Otherwise, wrap it in custom error
    console.debug('Error while waiting for database connection', {
      error: error.message,
      stack: error.stack
    })

    throw new DatabaseConnectionError(
      'Error while waiting for database connection',
      'DB_CONNECTION_WAIT_ERROR',
      { originalError: error.message }
    )
  }
}

/**
 * Verifies that the database connection is established.
 * If not, waits for the connection to be established.
 * @param {Object} mongoose - The mongoose instance
 * @returns {Promise<boolean>} A promise that resolves to true when the connection is verified.
 * @throws {DatabaseConnectionError} If the connection fails after retries.
 */
const verifyDatabaseConnection = async (mongoose) => {
  try {
    // Check if already connected
    if (mongoose.connection.readyState === 1) {
      return true
    }

    console.debug('Database not connected, waiting for connection...')
    return await waitForConnection(mongoose)
  } catch (error) {
    // If it's already our custom error, just rethrow it
    if (error instanceof DatabaseConnectionError) {
      throw error
    }

    // Otherwise, wrap it in our custom error
    console.debug('Error verifying database connection', {
      error: error.message,
      stack: error.stack
    })

    throw new DatabaseConnectionError(
      'Error verifying database connection',
      'DB_CONNECTION_VERIFICATION_ERROR',
      { originalError: error.message }
    )
  }
}

export { retryConnection, verifyDatabaseConnection, waitForConnection }
