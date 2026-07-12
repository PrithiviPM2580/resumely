import type { Request, Response, NextFunction } from "express";
import { APIError } from "../utils/api-error";
import { ENV } from "../config/env.config";
import { verifyToken } from "../utils/jwt";
import User from "../models/user.model";
import { TokenExpiredError, JsonWebTokenError } from "jsonwebtoken";

export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const token = req.cookies?.[ENV.COOKIE_NAME];

    if (!token)
      return next(APIError.Unauthorized("Authentication token is missing"));

    const payload = verifyToken(token);

    if (!payload)
      return next(APIError.Unauthorized("Invalid authentication token"));

    const user = await User.findById(payload.id);

    if (!user) return next(APIError.Unauthorized("User not found"));

    req.user = {
      id: user.id,
      email: user.email,
    };

    next();
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      return next(APIError.Unauthorized("Authentication token has expired"));
    }
    if (error instanceof JsonWebTokenError) {
      return next(APIError.Unauthorized("Invalid authentication token"));
    }
    return next(error);
  }
};
