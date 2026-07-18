import mongoose, { Document, Schema, Types } from "mongoose";

interface IssuesSchema {
  title: string;
  severity: "low" | "medium" | "high";
  explanation: string;
  fix: string;
}

interface StrengthsSchema {
  title: string;
  evidence: string;
}

interface BulletRewriteSchema {
  section: string;
  original: string;
  rewritten: string;
  rationale: string;
}

interface ScoreBreakdownSchema {
  keywords: number;
  formatting: number;
  impact: number;
  clarity: number;
}

const issuesSchema = new Schema<IssuesSchema>(
  {
    title: { type: String, required: true },
    severity: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    explanation: String,
    fix: String,
  },
  { _id: false },
);

const strengthsSchema = new Schema<StrengthsSchema>(
  {
    title: { type: String, required: true },
    evidence: String,
  },
  { _id: false },
);

const bulletRewriteSchema = new Schema<BulletRewriteSchema>(
  {
    section: String,
    original: { type: String, required: true },
    rewritten: { type: String, required: true },
    rationale: String,
  },
  { _id: true },
);

const scoreBreakdownSchema = new Schema<ScoreBreakdownSchema>(
  {
    keywords: { type: Number, min: 0, max: 25 },
    formatting: { type: Number, min: 0, max: 25 },
    impact: { type: Number, min: 0, max: 25 },
    clarity: { type: Number, min: 0, max: 25 },
  },
  { _id: false },
);

export interface IAnalysis extends Document {
  userId: Types.ObjectId;
  resumeId: Types.ObjectId;
  versionId: Types.ObjectId;

  atsScore: number;
  issues: IssuesSchema[];
  strengths: StrengthsSchema[];
  bulletRewrites: BulletRewriteSchema[];
  scoreBreakdown: ScoreBreakdownSchema;
  keywordsPresent: string[];
  keywordsMissing: string[];
  summary: string;

  modelName: string;
  promptTokens: number;
  responseTokens: number;

  createdAt: Date;
  updatedAt: Date;
}

const analysisSchema = new Schema<IAnalysis>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    resumeId: {
      type: Schema.Types.ObjectId,
      ref: "Resume",
      required: true,
      index: true,
    },
    versionId: {
      type: Schema.Types.ObjectId,
      ref: "ResumeVersion",
      required: true,
      index: true,
    },
    atsScore: {
      type: Number,
      min: 0,
      max: 100,
      required: true,
    },
    scoreBreakdown: scoreBreakdownSchema,
    issues: {
      type: [issuesSchema],
      default: [],
    },
    strengths: {
      type: [strengthsSchema],
      default: [],
    },
    bulletRewrites: {
      type: [bulletRewriteSchema],
      default: [],
    },
    keywordsPresent: {
      type: [String],
      default: [],
    },
    keywordsMissing: {
      type: [String],
      default: [],
    },
    summary: {
      type: String,
      default: "",
    },
    modelName: {
      type: String,
      required: true,
    },
    promptTokens: Number,
    responseTokens: Number,
  },
  { timestamps: true },
);

const Analysis = mongoose.model<IAnalysis>("Analysis", analysisSchema);
export default Analysis;
