class AppError extends Error {
  constructor(message, status = 500, details = undefined) {
    super(message);
    this.name = this.constructor.name;
    this.status = status;
    this.details = details;
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Resource not found', details) {
    super(message, 404, details);
  }
}

class ValidationError extends AppError {
  constructor(message = 'Invalid input', details) {
    super(message, 400, details);
  }
}

class ConflictError extends AppError {
  constructor(message = 'Conflict', details) {
    super(message, 409, details);
  }
}

class UnauthorizedError extends AppError {
  constructor(message = 'Not authorized to perform this action', details) {
    super(message, 403, details);
  }
}

module.exports = { AppError, NotFoundError, ValidationError, ConflictError, UnauthorizedError };
