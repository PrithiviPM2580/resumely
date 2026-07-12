import type { Request } from "express";
import { rateLimit, ipKeyGenerator, type Options } from "express-rate-limit";
import { ENV } from "../config/env.config";

const commonOptions = {
  standardHeaders: "draft-7" as const,
  legacyHeaders: false,
  skip: () => ENV.NODE_ENV === "development",
  keyGenerator: (req: Request) => req.user?.id ?? ipKeyGenerator(req.ip!),
  message: {
    statusCode: 429,
    status: "fail",
    message: "Too many requests, please try again later.",
  },
} satisfies Partial<Options>;

export const analyzeRateLimiter = rateLimit({
  ...commonOptions,
  windowMs: 60 * 1000, // 1 minute
  limit: 5,
});

export const authRateLimiter = rateLimit({
  ...commonOptions,
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 10,
});
