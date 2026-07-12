export class APIError extends Error {
  public readonly statusCode: number;
  public readonly status: "fail" | "error";
  public readonly isOperational: boolean;

  constructor(
    statusCode = 500,
    message = "Internal Server Error",
    public readonly details?: string | object,
  ) {
    super(message);

    Object.setPrototypeOf(this, APIError.prototype);

    this.statusCode = statusCode;
    this.status = statusCode >= 400 && statusCode < 500 ? "fail" : "error";

    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }

  static BadRequest(message = "Bad Request", details?: string | object) {
    return new APIError(400, message, details);
  }

  static Unauthorized(message = "Unauthorized") {
    return new APIError(401, message);
  }

  static Forbidden(message = "Forbidden") {
    return new APIError(403, message);
  }

  static NotFound(message = "Not Found") {
    return new APIError(404, message);
  }

  static Conflict(message = "Conflict", details?: string | object) {
    return new APIError(409, message, details);
  }

  static InternalServerError(message = "Internal Server Error") {
    return new APIError(500, message);
  }
}
