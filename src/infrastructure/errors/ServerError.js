/**
 * Server error classes.
 * These errors are related to server and infrastructure issues.
 */
import { BaseError } from './BaseError.js';

/**
 * Base class for all server errors
 */
export class ServerError extends BaseError {
  constructor(
    name = 'ServerError',
    message = 'An internal server error occurred',
    statusCode = 500,
    code = 'SERVER_ERROR',
    isOperational = false,
    details = {}
  ) {
    super(name, message, statusCode, code, isOperational, details);
  }
}

/**
 * Internal server error - Unexpected error
 */
export class InternalServerError extends ServerError {
  constructor(
    message = 'An unexpected error occurred on the server',
    code = 'INTERNAL_SERVER_ERROR',
    details = {}
  ) {
    super('InternalServerError', message, 500, code, false, details);
  }
}

/**
 * Service unavailable error - Server is temporarily unavailable
 */
export class ServiceUnavailableError extends ServerError {
  constructor(
    message = 'The service is temporarily unavailable',
    code = 'SERVICE_UNAVAILABLE',
    details = {}
  ) {
    super('ServiceUnavailableError', message, 503, code, true, details);
  }
}

/**
 * Not implemented error - Feature not implemented
 */
export class NotImplementedError extends ServerError {
  constructor(
    message = 'This feature is not implemented yet',
    code = 'NOT_IMPLEMENTED',
    details = {}
  ) {
    super('NotImplementedError', message, 501, code, true, details);
  }
}

/**
 * Configuration error - Server configuration issue
 */
export class ConfigurationError extends ServerError {
  constructor(
    message = 'Server configuration error',
    code = 'CONFIGURATION_ERROR',
    details = {}
  ) {
    super('ConfigurationError', message, 500, code, false, details);
  }
}

/**
 * External service error - Error communicating with external service
 */
export class ExternalServiceError extends ServerError {
  constructor(
    service = 'external service',
    message = `Error communicating with ${service}`,
    code = 'EXTERNAL_SERVICE_ERROR',
    details = {}
  ) {
    super('ExternalServiceError', message, 502, code, true, details);
  }
}
