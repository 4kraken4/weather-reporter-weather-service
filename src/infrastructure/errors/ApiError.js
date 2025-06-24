/**
 * API error classes for handling HTTP-specific errors.
 * These errors are typically related to client requests.
 */
import { BaseError } from './BaseError.js';

/**
 * Base class for all API errors (400-level errors)
 */
export class ApiError extends BaseError {
  constructor(
    name = 'ApiError',
    message = 'An error occurred with the API request',
    statusCode = 400,
    code = 'API_ERROR',
    details = {}
  ) {
    super(name, message, statusCode, code, true, details);
  }
}

/**
 * Bad request error (400)
 */
export class BadRequestError extends ApiError {
  constructor(
    message = 'The request was invalid or cannot be served',
    code = 'BAD_REQUEST',
    details = {}
  ) {
    super('BadRequestError', message, 400, code, details);
  }
}

/**
 * Validation error (400)
 */
export class ValidationError extends ApiError {
  constructor(
    message = 'The request data failed validation',
    validationErrors = [],
    code = 'VALIDATION_ERROR'
  ) {
    super('ValidationError', message, 400, code, { validationErrors });
  }
}

/**
 * Not found error (404)
 */
export class NotFoundError extends ApiError {
  constructor(
    resource = 'resource',
    message = `The requested ${resource} was not found`,
    code = 'NOT_FOUND',
    details = {}
  ) {
    super('NotFoundError', message, 404, code, details);
  }
}

/**
 * Conflict error (409)
 */
export class ConflictError extends ApiError {
  constructor(
    resource = 'resource',
    message = `The ${resource} already exists or conflicts with another resource`,
    code = 'CONFLICT',
    details = {}
  ) {
    super('ConflictError', message, 409, code, details);
  }
}

/**
 * Too many requests error (429)
 */
export class TooManyRequestsError extends ApiError {
  constructor(
    message = 'Too many requests, please try again later',
    code = 'TOO_MANY_REQUESTS',
    details = {}
  ) {
    super('TooManyRequestsError', message, 429, code, details);
  }
}
