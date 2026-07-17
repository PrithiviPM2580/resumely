import type { Request, Response } from "express";
import { Router } from "express";
import mongoose from "mongoose";
import {
  globalErrorHandler,
  notFoundHandler,
} from "../middleware/global-error.middleware";
import authRouter from "./auth.route";
import resumeRouter from "./resume.route";

const router: Router = Router();

router.get("/", (req: Request, res: Response) => {
  res.send("Welcome to the API");
});

router.get("/health", (req: Request, res: Response) => {
  const states = ["disconnected", "connected", "connecting", "disconnecting"];
  const health = {
    status: "ok",
    uptime: process.uptime(),
    message: "Healthy",
    timestamp: new Date().toISOString(),
    dbConnection: states[mongoose.connection.readyState ?? "unknown"],
  };
  res.status(200).json(health);
});

router.use("/api/auth", authRouter);
router.use("/api/resumes", resumeRouter);

router.use(notFoundHandler);
router.use(globalErrorHandler);

export default router;
