import type { Request, Response, NextFunction } from "express";
import { APIError } from "../utils/api-error";
import { ZodError } from "zod";
import mongoose from "mongoose";
import { ENV } from "../config/env.config";

interface ErrorResponse {
  status: string;
  message: string;
  details?: string | object;
  stack?: string;
}

export const notFoundHandler = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  return next(
    APIError.NotFound(`Route ${req.method} ${req.originalUrl} not found`),
  );
};

export const globalErrorHandler = (
  err: Error | APIError,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  let statusCode = 500;
  let status: "fail" | "error" = "error";
  let message = "Internal Server Error";
  let details: string | object | undefined;

  // Custom API Error
  if (err instanceof APIError) {
    statusCode = err.statusCode;
    status = err.status;
    message = err.message;
    details = err.details;
  }

  // Zod Validation Error
  else if (err instanceof ZodError) {
    statusCode = 400;
    status = "fail";
    message = "Validation Error";

    details = err.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
      code: issue.code,
    }));
  }

  // Mongoose Validation Error
  else if (err instanceof mongoose.Error.ValidationError) {
    statusCode = 400;
    status = "fail";
    message = "Validation Error";

    details = Object.values(err.errors).map((error) => ({
      path: error.path,
      message: error.message,
      name: error.name,
    }));
  }

  // Invalid Mongo ObjectId
  else if (err instanceof mongoose.Error.CastError) {
    statusCode = 400;
    status = "fail";
    message = "Invalid ID";

    details = {
      path: err.path,
      value: err.value,
      message: err.message,
    };
  }

  // Duplicate Mongo Key
  else if (err.name === "MongoServerError" && (err as any).code === 11000) {
    statusCode = 409;
    status = "fail";
    message = "Duplicate field value";

    details = {
      field: Object.keys((err as any).keyValue)[0],
    };
  }

  const response: ErrorResponse = {
    status,
    message,
  };

  if (details) {
    response.details = details;
  }

  // Development only
  if (ENV.NODE_ENV === "development") {
    response.stack = err.stack;
  }

  return res.status(statusCode).json(response);
};
