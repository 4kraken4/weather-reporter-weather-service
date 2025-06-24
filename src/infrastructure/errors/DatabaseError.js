/**
 * Database error classes.
 * These errors are related to database operations.
 */
import { BaseError } from './BaseError.js';

/**
 * Base class for all database errors
 */
export class DatabaseError extends BaseError {
  constructor(
    name = 'DatabaseError',
    message = 'A database error occurred',
    statusCode = 500,
    code = 'DATABASE_ERROR',
    details = {}
  ) {
    super(name, message, statusCode, code, details);
  }
}

/**
 * Connection error - Failed to connect to the database
 */
export class DatabaseConnectionError extends DatabaseError {
  constructor(
    message = 'Failed to connect to the database',
    code = 'DATABASE_CONNECTION_ERROR',
    details = {}
  ) {
    super('DatabaseConnectionError', message, 503, code, details);
  }
}

/**
 * Query error - Error executing a database query
 */
export class DatabaseQueryError extends DatabaseError {
  constructor(
    message = 'Error executing database query',
    code = 'DATABASE_QUERY_ERROR',
    details = {}
  ) {
    super('DatabaseQueryError', message, 500, code, details);
  }
}

/**
 * Transaction error - Error with database transaction
 */
export class DatabaseTransactionError extends DatabaseError {
  constructor(
    message = 'Database transaction failed',
    code = 'DATABASE_TRANSACTION_ERROR',
    details = {}
  ) {
    super('DatabaseTransactionError', message, 500, code, details);
  }
}

/**
 * Duplicate key error - Unique constraint violation
 */
export class DuplicateKeyError extends DatabaseError {
  constructor(
    message = 'A record with the same key already exists',
    code = 'DUPLICATE_KEY_ERROR',
    details = {}
  ) {
    // Use 409 Conflict for duplicate key errors
    super('DuplicateKeyError', message, 409, code, details);
  }
}
