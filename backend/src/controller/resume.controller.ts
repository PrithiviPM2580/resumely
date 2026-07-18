import type { Request, Response, NextFunction } from "express";
import { APIError } from "../utils/api-error";
import Resume from "../models/resume.model";
import type { TypeRequest } from "../types";
import type {
  AnayaResumeInput,
  CreateResumeInput,
  ResumeParams,
  ResumeVersionParams,
} from "../validation/resume.validation";
import { extractTextFromPdf } from "../service/pdf.service";
import { parseResumeText } from "../service/structured-parser.service";
import ResumeVersion from "../models/resume-version.model";
import { analyzeResumeOutput } from "../service/gemini.service";
import Analysis from "../models/analysis.model";

export const createResume = async (
  req: TypeRequest<CreateResumeInput>,
  res: Response,
  next: NextFunction,
) => {
  const { title } = req.body;

  if (!req.file) {
    return next(APIError.BadRequest("A valid PDF file is required"));
  }

  const { text, meta } = await extractTextFromPdf(req.file.buffer);
  const parsedSections = await parseResumeText(text);

  const resume = await Resume.create({
    userId: req.user!.id,
    title,
    latestVersionNumber: 1,
  });

  const version = await ResumeVersion.create({
    resumeId: resume._id,
    versionNumber: 1,
    label: "V1",
    rawText: text,
    parsedSections,
    sourceType: "upload",
    parentVersionId: null,
  });

  resume.currentVersionId = version._id;
  await resume.save();

  return res.status(201).json({
    status: "success",
    message: "Resume created successfully",
    data: {
      resume,
      version,
      meta,
    },
  });
};

export const getResumeVersions = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const resumes = await Resume.find({
    userId: req.user!.id,
  })
    .sort({ createdAt: -1 })
    .lean();

  if (!resumes || resumes.length === 0) {
    return next(APIError.NotFound("No resumes found for the user"));
  }

  return res.status(200).json({
    status: "success",
    message: "Resumes retrieved successfully",
    data: {
      resumes,
    },
  });
};

export const getResumeVersionById = async (
  req: TypeRequest<unknown, ResumeParams>,
  res: Response,
  next: NextFunction,
) => {
  const { id } = req.params;

  const resume = await Resume.findOne({
    _id: id,
    userId: req.user!.id,
  });

  if (!resume) return next(APIError.NotFound("Resume not found"));

  const versions = await ResumeVersion.find({
    resumeId: resume._id,
  })
    .sort({ versionNumber: 1 })
    .select("-rawText")
    .lean();

  if (!versions || versions.length === 0) {
    return next(APIError.NotFound("No versions found for the resume"));
  }

  return res.status(200).json({
    status: "success",
    message: "Resume versions retrieved successfully",
    data: {
      resume,
      versions,
    },
  });
};

export const getResumeByVersionId = async (
  req: TypeRequest<unknown, ResumeVersionParams>,
  res: Response,
  next: NextFunction,
) => {
  const { id, versionId } = req.params;

  const resume = await Resume.findOne({
    _id: id,
    userId: req.user!.id,
  });

  if (!resume) return next(APIError.NotFound("Resume not found"));

  const version = await ResumeVersion.findOne({
    _id: versionId,
    resumeId: resume._id,
  });

  if (!version) return next(APIError.NotFound("Version not found"));

  return res.status(200).json({
    status: "success",
    message: "Resume version retrieved successfully",
    data: {
      resume,
      version,
    },
  });
};

export const deleteResume = async (
  req: TypeRequest<unknown, ResumeParams>,
  res: Response,
  next: NextFunction,
) => {
  const { id } = req.params;

  const resume = await Resume.findOne({
    _id: id,
    userId: req.user!.id,
  });

  if (!resume) return next(APIError.NotFound("Resume not found"));

  await Promise.all([
    ResumeVersion.deleteMany({ resumeId: resume._id }),
    Analysis.deleteMany({ resumeId: resume._id }),
    resume.deleteOne(),
  ]);

  return res.status(200).json({
    status: "success",
    message: "Resume and its versions deleted successfully",
  });
};

export const analyzeResume = async (
  req: TypeRequest<AnayaResumeInput, ResumeParams>,
  res: Response,
  next: NextFunction,
) => {
  const { id } = req.params;

  const resume = await Resume.findOne({
    _id: id,
    userId: req.user!.id,
  });

  if (!resume) return next(APIError.NotFound("Resume not found"));

  const versionId = req.body.versionId || resume.currentVersionId;
  if (!versionId)
    return next(APIError.NotFound("No version found for the resume"));

  const version = await ResumeVersion.findOne({
    _id: versionId,
    resumeId: resume._id,
  });

  if (!version) return next(APIError.NotFound("Version not found"));

  const { analysis, model, promptTokens, responseTokens } =
    await analyzeResumeOutput({
      rawText: version.rawText,
      targetRole: req.body.targetRole,
    });

  const saved = await Analysis.create({
    userId: req.user!.id,
    resumeId: resume._id,
    versionId: version._id,
    atsScore: analysis.atsScore,
    issues: analysis.issues,
    scoreBreakdown: analysis.scoreBreakdown,
    strengths: analysis.strengths,
    bulletRewrites: analysis.bulletRewrites,
    keywordsPresent: analysis.keywordsPresent,
    keywordsMissing: analysis.keywordsMissing,
    summary: analysis.summary,
    modelName: model,
    promptTokens,
    responseTokens,
  });

  version.latestAnalysisId = saved._id;
  await version.save();

  return res.status(200).json({
    status: "success",
    message: "Resume analyzed successfully",
    data: {
      analysis: saved,
      version,
    },
  });
};

export const getAnalysisResumes = async (
  req: TypeRequest<unknown, ResumeParams>,
  res: Response,
  next: NextFunction,
) => {
  const { id } = req.params;

  const resume = await Resume.findOne({
    _id: id,
    userId: req.user!.id,
  });

  if (!resume) return next(APIError.NotFound("Resume not found"));

  const analysis = await Analysis.find({
    resumeId: resume._id,
  })
    .sort({ createdAt: -1 })
    .lean();

  if (!analysis || analysis.length === 0) {
    return next(APIError.NotFound("No analysis found for the resume"));
  }

  return res.status(200).json({
    status: "success",
    message: "Resume analysis retrieved successfully",
    data: {
      resume,
      analysis,
    },
  });
};

export const getAnalysisByVesions = async (
  req: TypeRequest<unknown, ResumeVersionParams>,
  res: Response,
  next: NextFunction,
) => {
  const { id, versionId } = req.params;

  const resume = await Resume.findOne({
    _id: id,
    userId: req.user!.id,
  });

  if (!resume) return next(APIError.NotFound("Resume not found"));

  const version = await ResumeVersion.findOne({
    _id: versionId,
    resumeId: resume._id,
  });

  if (!version) return next(APIError.NotFound("Version not found"));

  const analysis = await Analysis.findOne({
    resumeId: resume._id,
    versionId: version._id,
  })
    .sort({ createdAt: -1 })
    .lean();

  if (!analysis)
    return next(APIError.NotFound("No analysis found for the version"));

  return res.status(200).json({
    status: "success",
    message: "Resume analysis retrieved successfully",
    data: {
      resume,
      version,
      analysis,
    },
  });
};
