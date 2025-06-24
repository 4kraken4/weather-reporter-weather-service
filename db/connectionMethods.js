/**
 * Methods for establishing database connections
 * @module connectionMethods
 */

import mongoose from 'mongoose';

import config from '../src/config/Config.js';
import { DatabaseConnectionError } from '../src/infrastructure/errors/index.js';

import { retryConnection } from './connectionHelpers.js';

/**
 * Connects to the MongoDB database using certificate authentication.
 * Implements connection pooling for improved performance and reliability.
 * @returns {Promise} A promise that resolves when the connection is established.
 * @throws {DatabaseConnectionError} If the connection fails after retries.
 */

/**
 * Sets the default promise library to use for Mongoose.
 * @type {PromiseConstructor}
 */
mongoose.Promise = Promise;

/**
 * Event listener for the 'error' event of the database connection.
 * @param {Error} error - The error object.
 */
mongoose.connection.on('error', error => {
  throw new DatabaseConnectionError(
    'Failed to connect to the database',
    'DB_CONNECTION_ERROR',
    { originalError: error.message }
  );
});

/**
 * Event listener for the 'open' event of the database connection.
 */
mongoose.connection.once('open', () => {
  // eslint-disable-next-line no-console
  console.debug('Database connection established successfully');
});

/**
 * Event listener for the 'disconnected' event of the database connection.
 */
mongoose.connection.on('disconnected', () => {
  console.warn('Database connection lost. Attempting to reconnect...');
});

/**
 * Event listener for the 'reconnected' event of the database connection.
 */
mongoose.connection.on('reconnected', () => {
  // eslint-disable-next-line no-console
  console.debug('Successfully reconnected to the database');
});

const connectToDatabase = async () => {
  // eslint-disable-next-line no-console
  console.debug('Attempting to connect to database with certificate authentication');
  try {
    const credentials = config.getInstance().db.mongo.certPath;
    const connection_string = config.getInstance().db.mongo.connection;
    const database_name = config.getInstance().db.mongo.dbName;

    if (!connection_string) {
      throw new DatabaseConnectionError(
        'Database connection string is missing',
        'DB_CONNECTION_STRING_MISSING'
      );
    }

    if (!credentials) {
      throw new DatabaseConnectionError(
        'Database certificate path is missing',
        'DB_CERTIFICATE_MISSING'
      );
    }

    await mongoose.connect(connection_string, {
      tlsCertificateKeyFile: credentials,
      authMechanism: 'MONGODB-X509',
      authSource: '$external',
      dbName: database_name,
      maxIdleTimeMS: 30000,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      heartbeatFrequencyMS: 10000,
      retryWrites: true,
      retryReads: true,
      w: 'majority'
    });
    return true;
    // eslint-disable-next-line no-unused-vars
  } catch (error) {
    return retryConnection(
      connectToDatabase,
      'certificate authentication',
      'DB_CONNECTION_RETRY_FAILED'
    );
  }
};

/**
 * Connects to the MongoDB database using username and password authentication.
 * Implements connection pooling for improved performance and reliability.
 * @returns {Promise} A promise that resolves when the connection is established.
 * @throws {DatabaseConnectionError} If the connection fails after retries.
 */
const connectWithCredentials = async () => {
  try {
    // eslint-disable-next-line no-console
    console.debug(
      'Attempting to connect to database with username/password authentication'
    );

    const username = config.getInstance().db.mongo.user;
    const password = config.getInstance().db.mongo.password;
    const cluster_name = config.getInstance().db.mongo.cluster;
    const database_name = config.getInstance().db.mongo.dbName;

    // Validate required parameters
    if (!username) {
      throw new DatabaseConnectionError(
        'Database username is missing',
        'DB_USERNAME_MISSING'
      );
    }

    if (!password) {
      throw new DatabaseConnectionError(
        'Database password is missing',
        'DB_PASSWORD_MISSING'
      );
    }

    if (!cluster_name) {
      throw new DatabaseConnectionError(
        'Database cluster name is missing',
        'DB_CLUSTER_MISSING'
      );
    }

    if (!database_name) {
      throw new DatabaseConnectionError(
        'Database name is missing',
        'DB_NAME_MISSING'
      );
    }

    // Construct a connection string with proper encoding
    const connectionString = `mongodb+srv://${encodeURIComponent(username)}:${encodeURIComponent(
      password
    )}@${encodeURIComponent(cluster_name)}.wyprrfj.mongodb.net/${encodeURIComponent(
      database_name
    )}?retryWrites=true&w=majority&appName=${encodeURIComponent(cluster_name)}`;

    await mongoose.connect(connectionString, {
      maxIdleTimeMS: 30000,
      autoIndex: true,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      heartbeatFrequencyMS: 10000,
      authSource: 'admin', // Use 'admin' for username/password auth
      retryWrites: true,
      retryReads: true,
      w: 'majority'
    });

    return true;
    // eslint-disable-next-line no-unused-vars
  } catch (error) {
    // Retry logic using the helper function
    return retryConnection(
      connectWithCredentials,
      'username/password authentication',
      'DB_CREDENTIALS_CONNECTION_RETRY_FAILED'
    );
  }
};

export { connectToDatabase, connectWithCredentials };
