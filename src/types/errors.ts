export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public details?: any,
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 409, details);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = "Unauthorized", details?: any) {
    super(message, 401, details);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = "Forbidden", details?: any) {
    super(message, 403, details);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = "Not Found", details?: any) {
    super(message, 404, details);
  }
}
