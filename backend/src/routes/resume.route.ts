import { Router } from "express";
import { validateRequest } from "../middleware/validate-request.middleware";
import {
  createResumeSchema,
  resumeParamsSchema,
  resumeVersionParamsSchema,
} from "../validation/resume.validation";
import { asyncHandler } from "../middleware/async-handler.middleware";
import {
  createResume,
  deleteResume,
  getResumeByVersionId,
  getResumeVersionById,
  getResumeVersions,
} from "../controller/resume.controller";
import { requireAuth } from "../middleware/require-auth.middleware";

const resumeRouter = Router();

resumeRouter
  .route("/")
  .post(
    requireAuth,
    validateRequest({ body: createResumeSchema }),
    asyncHandler(createResume),
  );

resumeRouter.route("/").get(requireAuth, asyncHandler(getResumeVersions));

resumeRouter
  .route("/:id")
  .get(
    requireAuth,
    validateRequest({ params: resumeParamsSchema }),
    asyncHandler(getResumeVersionById),
  );

resumeRouter
  .route("/:id/versions/:versionId")
  .get(
    requireAuth,
    validateRequest({ params: resumeVersionParamsSchema }),
    asyncHandler(getResumeByVersionId),
  );

resumeRouter
  .route("/:id")
  .delete(
    requireAuth,
    validateRequest({ params: resumeParamsSchema }),
    asyncHandler(deleteResume),
  );

export default resumeRouter;
