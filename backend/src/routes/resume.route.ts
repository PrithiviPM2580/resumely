import { Router } from "express";
import { validateRequest } from "../middleware/validate-request.middleware";
import {
  anayaResumeSchema,
  createResumeSchema,
  resumeParamsSchema,
  resumeVersionParamsSchema,
} from "../validation/resume.validation";
import { asyncHandler } from "../middleware/async-handler.middleware";
import {
  analyzeResume,
  createResume,
  deleteResume,
  getAnalysisByVesions,
  getAnalysisResumes,
  getResumeByVersionId,
  getResumeVersionById,
  getResumeVersions,
} from "../controller/resume.controller";
import { requireAuth } from "../middleware/require-auth.middleware";
import { uploadPdf } from "../middleware/multer.middleware";

const resumeRouter = Router();

resumeRouter
  .route("/")
  .post(
    requireAuth,
    uploadPdf("file"),
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

resumeRouter
  .route("/:id/analyze")
  .post(
    requireAuth,
    validateRequest({ body: anayaResumeSchema, params: resumeParamsSchema }),
    asyncHandler(analyzeResume),
  );

resumeRouter
  .route("/:id/analysis")
  .get(
    requireAuth,
    validateRequest({ params: resumeParamsSchema }),
    asyncHandler(getAnalysisResumes),
  );

resumeRouter
  .route("/:id/versions/:versionId/analysis")
  .get(
    requireAuth,
    validateRequest({ params: resumeVersionParamsSchema }),
    asyncHandler(getAnalysisByVesions),
  );

export default resumeRouter;
