import { Types } from "mongoose";
import { z } from "zod";

export const resumeParamsSchema = z.object({
  id: z.string().refine((id) => Types.ObjectId.isValid(id), {
    message: "Invalid MongoDB ObjectId",
  }),
});

export const resumeVersionParamsSchema = z.object({
  id: z.string().refine((id) => Types.ObjectId.isValid(id), {
    message: "Invalid MongoDB ObjectId",
  }),
  versionId: z.string().refine((id) => Types.ObjectId.isValid(id), {
    message: "Invalid MongoDB ObjectId",
  }),
});

export const createResumeSchema = z.object({
  title: z.string().min(1, { message: "Resume title is required" }),
});

export const anayaResumeSchema = z.object({
  versionId: z
    .string()
    .refine((id) => Types.ObjectId.isValid(id), {
      message: "Invalid MongoDB ObjectId",
    })
    .optional(),
  targetRole: z.string().min(1),
});

export type ResumeParams = z.infer<typeof resumeParamsSchema>;
export type ResumeVersionParams = z.infer<typeof resumeVersionParamsSchema>;
export type CreateResumeInput = z.infer<typeof createResumeSchema>;
export type AnayaResumeInput = z.infer<typeof anayaResumeSchema>;
