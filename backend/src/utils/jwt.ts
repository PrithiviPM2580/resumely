import jwt from "jsonwebtoken";
import type { Payload } from "../types";
import { APIError } from "./api-error";
import type { CookieOptions } from "express";
import { ENV } from "../config/env.config";

export const signToken = (
  payload: Payload,
  options?: jwt.SignOptions,
): string => {
  return jwt.sign(payload, ENV.JWT_SECRET, {
    expiresIn: "7d",
    ...options,
  });
};

export const verifyToken = (token: string): Payload => {
  try {
    return jwt.verify(token, ENV.JWT_SECRET) as Payload;
  } catch (error) {
    throw new APIError(401, "Invalid token");
  }
};

export const cookieOptions: CookieOptions = {
  httpOnly: true,
  secure: ENV.NODE_ENV === "production" ? true : false,
  sameSite: ENV.NODE_ENV === "production" ? "none" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: "/",
};
