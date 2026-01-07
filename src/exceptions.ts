/** Exception classes for Mielto API. */

export interface ErrorResponse {
  detail?: string;
  error_code?: string;
  [key: string]: any;
}

export class MieltoError extends Error {
  public readonly statusCode?: number;
  public readonly responseData?: ErrorResponse;

  constructor(
    message: string,
    statusCode?: number,
    responseData?: ErrorResponse
  ) {
    super(message);
    this.name = 'MieltoError';
    this.statusCode = statusCode;
    this.responseData = responseData;
    Object.setPrototypeOf(this, MieltoError.prototype);
  }
}

export class AuthenticationError extends MieltoError {
  constructor(message: string, statusCode?: number, responseData?: ErrorResponse) {
    super(message, statusCode, responseData);
    this.name = 'AuthenticationError';
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

export class PermissionError extends MieltoError {
  constructor(message: string, statusCode?: number, responseData?: ErrorResponse) {
    super(message, statusCode, responseData);
    this.name = 'PermissionError';
    Object.setPrototypeOf(this, PermissionError.prototype);
  }
}

export class NotFoundError extends MieltoError {
  constructor(message: string, statusCode?: number, responseData?: ErrorResponse) {
    super(message, statusCode, responseData);
    this.name = 'NotFoundError';
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

export class ValidationError extends MieltoError {
  constructor(message: string, statusCode?: number, responseData?: ErrorResponse) {
    super(message, statusCode, responseData);
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

export class RateLimitError extends MieltoError {
  constructor(message: string, statusCode?: number, responseData?: ErrorResponse) {
    super(message, statusCode, responseData);
    this.name = 'RateLimitError';
    Object.setPrototypeOf(this, RateLimitError.prototype);
  }
}

export class ServerError extends MieltoError {
  constructor(message: string, statusCode?: number, responseData?: ErrorResponse) {
    super(message, statusCode, responseData);
    this.name = 'ServerError';
    Object.setPrototypeOf(this, ServerError.prototype);
  }
}

export class TimeoutError extends MieltoError {
  constructor(message: string, statusCode?: number, responseData?: ErrorResponse) {
    super(message, statusCode, responseData);
    this.name = 'TimeoutError';
    Object.setPrototypeOf(this, TimeoutError.prototype);
  }
}

export class ConnectionError extends MieltoError {
  constructor(message: string, statusCode?: number, responseData?: ErrorResponse) {
    super(message, statusCode, responseData);
    this.name = 'ConnectionError';
    Object.setPrototypeOf(this, ConnectionError.prototype);
  }
}

export class PaymentRequiredError extends MieltoError {
  constructor(message: string, statusCode?: number, responseData?: ErrorResponse) {
    super(message, statusCode, responseData);
    this.name = 'PaymentRequiredError';
    Object.setPrototypeOf(this, PaymentRequiredError.prototype);
  }
}

export class CreditLimitExceededError extends MieltoError {
  constructor(message: string, statusCode?: number, responseData?: ErrorResponse) {
    super(message, statusCode, responseData);
    this.name = 'CreditLimitExceededError';
    Object.setPrototypeOf(this, CreditLimitExceededError.prototype);
  }
}

export class OverageLimitExceededError extends MieltoError {
  constructor(message: string, statusCode?: number, responseData?: ErrorResponse) {
    super(message, statusCode, responseData);
    this.name = 'OverageLimitExceededError';
    Object.setPrototypeOf(this, OverageLimitExceededError.prototype);
  }
}

