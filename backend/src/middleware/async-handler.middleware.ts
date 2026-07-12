import type { Request, Response, NextFunction } from "express";

type AsyncController = (
  req: any,
  res: Response,
  next: NextFunction,
) => Promise<void | Response>;

export const asyncHandler = (controller: AsyncController) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await controller(req, res, next);
    } catch (error) {
      next(error);
    }
  };
};
