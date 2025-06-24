/**
 * This module establishes a connection to the MongoDB database using Mongoose.
 * @module mongoose
 * @description This file re-exports connection methods and helpers from specialized modules
 * and implements resilience features for database connections
 */

import mongoose from 'mongoose';

import config from '../src/config/Config.js';
import DatabaseFailover from '../src/utils/DatabaseFailover.js';

import { verifyDatabaseConnection, waitForConnection } from './connectionHelpers.js';
import { connectToDatabase, connectWithCredentials } from './connectionMethods.js';

/**
 * Database failover instance for managing database connections with resilience
 * @type {DatabaseFailover}
 */
const databaseFailover = new DatabaseFailover({
  connectFn: config.getInstance().db.mongo.useCertAuth
    ? connectToDatabase
    : connectWithCredentials,
  enableCircuitBreaker: true
});

/**
 * Connects to the database with resilience features
 * @returns {Promise<boolean>} - True if connection successful
 * @throws {Error} - If all connection attempts fail
 */
const connectWithResilience = async () => {
  try {
    return await databaseFailover.connect();
    // eslint-disable-next-line no-unused-vars
  } catch (error) {
    throw new Error('DbConnectionError');
  }
};

export {
  connectWithResilience,
  mongoose,
  verifyDatabaseConnection,
  waitForConnection
};
