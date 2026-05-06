export class AppError extends Error {
  constructor(code, message, status = 400, details = {}) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = status;
    this.details = details;
    this.isOperational = true;
  }
}
