/**
 * Business error classes.
 * These errors are related to business logic and domain rules.
 */
import { BaseError } from './BaseError.js';

/**
 * Base class for all business logic errors
 */
export class BusinessError extends BaseError {
  constructor(
    name = 'BusinessError',
    message = 'A business rule was violated',
    statusCode = 400,
    code = 'BUSINESS_ERROR',
    details = {}
  ) {
    super(name, message, statusCode, code, true, details);
  }
}

/**
 * Invalid operation error - Operation not allowed in the current state
 */
export class InvalidOperationError extends BusinessError {
  constructor(
    message = 'This operation is not allowed in the current state',
    code = 'INVALID_OPERATION',
    details = {}
  ) {
    super('InvalidOperationError', message, 400, code, details);
  }
}

/**
 * Resource not found error - Domain-specific not found
 */
export class ResourceNotFoundError extends BusinessError {
  constructor(
    resource = 'resource',
    message = `The requested ${resource} was not found`,
    code = 'RESOURCE_NOT_FOUND',
    details = {}
  ) {
    super('ResourceNotFoundError', message, 404, code, details);
  }
}

/**
 * User not found error
 */
export class UserNotFoundError extends ResourceNotFoundError {
  constructor(
    message = 'The requested user was not found',
    code = 'USER_NOT_FOUND',
    details = {}
  ) {
    super('user', message, code, details);
  }
}

/**
 * Device not found error
 */
export class DeviceNotFoundError extends ResourceNotFoundError {
  constructor(
    message = 'The requested device was not found',
    code = 'DEVICE_NOT_FOUND',
    details = {}
  ) {
    super('device', message, code, details);
  }
}

/**
 * Station not found error
 */
export class StationNotFoundError extends ResourceNotFoundError {
  constructor(
    message = 'The requested station was not found',
    code = 'STATION_NOT_FOUND',
    details = {}
  ) {
    super('station', message, code, details);
  }
}

/**
 * Resource exists error - Domain-specific conflict
 */
export class ResourceExistsError extends BusinessError {
  constructor(
    resource = 'resource',
    message = `The ${resource} already exists`,
    code = 'RESOURCE_EXISTS',
    details = {}
  ) {
    super('ResourceExistsError', message, 409, code, details);
  }
}

/**
 * User exists error
 */
export class UserExistsError extends ResourceExistsError {
  constructor(
    message = 'A user with this email already exists',
    code = 'USER_EXISTS',
    details = {}
  ) {
    super('user', message, code, details);
  }
}

/**
 * Device exists error
 */
export class DeviceExistsError extends ResourceExistsError {
  constructor(
    message = 'A device with this name already exists',
    code = 'DEVICE_EXISTS',
    details = {}
  ) {
    super('device', message, code, details);
  }
}

/**
 * Station exists error
 */
export class StationExistsError extends ResourceExistsError {
  constructor(
    message = 'A station with this name already exists',
    code = 'STATION_EXISTS',
    details = {}
  ) {
    super('station', message, code, details);
  }
}
