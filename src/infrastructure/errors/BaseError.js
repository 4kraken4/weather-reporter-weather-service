/**
 * Base error class for the application.
 * All custom errors should extend this class.
 */
export class BaseError extends Error {
  /**
   * Create a new BaseError
   * @param {string} name - The error name
   * @param {string} message - User-friendly error message
   * @param {number} statusCode - HTTP status code
   * @param {string} code - Application-specific error code
   * @param {boolean} isOperational - Whether this is an operational error
   * @param {Object} details - Additional error details
   */
  constructor(
    name,
    message,
    statusCode = 500,
    code = 'INTERNAL_SERVER_ERROR',
    isOperational = true,
    details = {}
  ) {
    super(message);
    this.name = name;
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.details = details;

    // Capture stack trace, excluding the constructor call from the stack
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Convert the error to a JSON object for API responses
   * @returns {Object} JSON representation of the error
   */
  toJSON() {
    return {
      error: {
        name: this.name,
        message: this.message,
        code: this.code,
        ...(Object.keys(this.details).length > 0 && { details: this.details })
      }
    };
  }

  /**
   * Get a structured object for logging
   * @returns {Object} Structured log object
   */
  toLog() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      isOperational: this.isOperational,
      stack: this.stack,
      details: this.details
    };
  }
}
