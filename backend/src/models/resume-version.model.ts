import mongoose, { Document, Schema, Model } from "mongoose";

interface LinkSchema {
  label: string;
  url: string;
}

interface BasicSchema {
  name: string;
  title: string;
  location: string;
  email: string;
  phone: string;
  links: [LinkSchema];
}

interface ExperienceItemSchema {
  company: string;
  role: string;
  location: string;
  periond: string;
  bullets: [string];
}

interface EducationItemSchema {
  degree: string;
  school: string;
  location: string;
  period: string;
  details: string;
}

interface ProjectItemSchema {
  name: string;
  description: string;
  tech: [string];
  links: [LinkSchema];
}

interface CertificationItemSchema {
  name: string;
  issue: string;
  year: string;
}

interface ParsedSectionsSchema {
  basics: BasicSchema;
  summary: string;
  experience: [ExperienceItemSchema];
  education: [EducationItemSchema];
  projects: [ProjectItemSchema];
  certifications: [CertificationItemSchema];
  skills: [string];
  languages: [string];
  interests: [string];
}

const linkSchema = new Schema<LinkSchema>(
  {
    label: { type: String, required: true },
    url: { type: String, required: true },
  },
  { _id: false },
);

const basicSchema = new Schema<BasicSchema>(
  {
    name: { type: String },
    title: { type: String },
    location: { type: String },
    email: { type: String },
    phone: { type: String },
    links: { type: [linkSchema] },
  },
  { _id: false },
);

const experienceItemSchema = new Schema<ExperienceItemSchema>(
  {
    company: { type: String },
    role: { type: String },
    location: { type: String },
    periond: { type: String },
    bullets: { type: [String] },
  },
  { _id: false },
);

const educationItemSchema = new Schema<EducationItemSchema>(
  {
    degree: { type: String },
    school: { type: String },
    location: { type: String },
    period: { type: String },
    details: { type: String },
  },
  { _id: false },
);

const projectItemSchema = new Schema<ProjectItemSchema>({
  name: { type: String },
  description: { type: String },
  tech: { type: [String] },
  links: { type: [linkSchema] },
});

const certificationItemSchema = new Schema<CertificationItemSchema>({
  name: { type: String },
  issue: { type: String },
  year: { type: String },
});

const parsedSectionsSchema = new Schema<ParsedSectionsSchema>(
  {
    basics: { type: basicSchema, default: () => ({}) },
    summary: { type: String, default: "" },
    experience: { type: [experienceItemSchema], default: [] },
    education: { type: [educationItemSchema], default: [] },
    projects: { type: [projectItemSchema], default: [] },
    certifications: { type: [certificationItemSchema], default: [] },
    skills: { type: [String], default: [] },
    languages: { type: [String], default: [] },
    interests: { type: [String], default: [] },
  },
  { _id: false },
);

export interface IResumeVersion extends Document {
  resumeId: mongoose.Types.ObjectId;
  versionNumber: number;
  label: string;
  rawText: string;
  parsedSections: ParsedSectionsSchema;
  sourceType: "upload" | "rewrite";
  parentVersionId: mongoose.Types.ObjectId;
  latestAnalysisId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const resumeVersionSchema = new Schema<IResumeVersion>(
  {
    resumeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resume",
      required: true,
      index: true,
    },
    versionNumber: {
      type: Number,
      required: true,
    },
    label: {
      type: String,
      required: true,
    },
    rawText: {
      type: String,
      required: true,
    },
    parsedSections: {
      type: parsedSectionsSchema,
      default: () => ({}),
    },
    sourceType: {
      type: String,
      enum: ["upload", "rewrite"],
      required: true,
    },
    parentVersionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ResumeVersion",
      default: null,
    },
    latestAnalysisId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Analysis",
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

resumeVersionSchema.index({ resumeId: 1, versionNumber: 1 }, { unique: true });

const ResumeVersion = mongoose.model<IResumeVersion>(
  "ResumeVersion",
  resumeVersionSchema,
);

export default ResumeVersion;
