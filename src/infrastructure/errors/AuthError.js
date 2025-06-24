/**
 * Authentication and authorization error classes.
 * These errors are related to user authentication and permissions.
 */
import { BaseError } from './BaseError.js';

/**
 * Base class for all authentication errors
 */
export class AuthError extends BaseError {
  constructor(
    name = 'AuthError',
    message = 'Authentication error',
    statusCode = 401,
    code = 'AUTH_ERROR',
    details = {}
  ) {
    super(name, message, statusCode, code, true, details);
  }
}

/**
 * Unauthorized error (401) - User is not authenticated
 */
export class UnauthorizedError extends AuthError {
  constructor(
    message = 'Authentication is required to access this resource',
    code = 'UNAUTHORIZED',
    details = {}
  ) {
    super('UnauthorizedError', message, 401, code, details);
  }
}

/**
 * Invalid credentials error (401)
 */
export class InvalidCredentialsError extends AuthError {
  constructor(
    message = 'The provided credentials are invalid',
    code = 'INVALID_CREDENTIALS',
    details = {}
  ) {
    super('InvalidCredentialsError', message, 401, code, details);
  }
}

/**
 * Token error (401) - Issues with JWT tokens
 */
export class TokenError extends AuthError {
  constructor(
    message = 'Invalid or expired token',
    code = 'TOKEN_ERROR',
    details = {}
  ) {
    super('TokenError', message, 401, code, details);
  }
}

/**
 * Forbidden error (403) - User is authenticated but doesn't have permission
 */
export class ForbiddenError extends AuthError {
  constructor(
    message = 'You do not have permission to access this resource',
    code = 'FORBIDDEN',
    details = {}
  ) {
    super('ForbiddenError', message, 403, code, details);
  }
}

/**
 * API key error (401) - Issues with API keys
 */
export class ApiKeyError extends AuthError {
  constructor(
    message = 'Invalid, missing, or expired API key',
    code = 'API_KEY_ERROR',
    details = {}
  ) {
    super('ApiKeyError', message, 401, code, details);
  }
}
