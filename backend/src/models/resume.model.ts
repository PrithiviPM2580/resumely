import mongoose, { Schema, Document, Model } from "mongoose";

export interface IResume extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  currentVersionId: mongoose.Types.ObjectId | null;
  latestVersionNumber: number;
}

const resumeSchema = new Schema<IResume>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    currentVersionId: {
      type: Schema.Types.ObjectId,
      ref: "ResumeVersion",
      default: null,
    },
    latestVersionNumber: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

resumeSchema.index({ userId: 1, updatedAt: -1 });

const Resume = mongoose.model<IResume>("Resume", resumeSchema);

export default Resume;
