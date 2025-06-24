/**
 * Error module index file.
 * Exports all error classes for easier importing.
 */

// Base error
export { BaseError } from './BaseError.js';

// API errors
export {
  ApiError,
  BadRequestError,
  ConflictError,
  NotFoundError,
  TooManyRequestsError,
  ValidationError
} from './ApiError.js';

// Authentication errors
export {
  ApiKeyError,
  AuthError,
  ForbiddenError,
  InvalidCredentialsError,
  TokenError,
  UnauthorizedError
} from './AuthError.js';

// Database errors
export {
  DatabaseConnectionError,
  DatabaseError,
  DatabaseQueryError,
  DatabaseTransactionError,
  DuplicateKeyError
} from './DatabaseError.js';

// Server errors
export {
  ConfigurationError,
  ExternalServiceError,
  InternalServerError,
  NotImplementedError,
  ServerError,
  ServiceUnavailableError
} from './ServerError.js';

// Business errors
export {
  BusinessError,
  DeviceExistsError,
  DeviceNotFoundError,
  InvalidOperationError,
  ResourceExistsError,
  ResourceNotFoundError,
  StationExistsError,
  StationNotFoundError,
  UserExistsError,
  UserNotFoundError
} from './BusinessError.js';
