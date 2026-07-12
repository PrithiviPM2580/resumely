import { z } from "zod";

export const registerSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(80, "Name must be less than 80 characters"),
  email: z.email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const loginSchema = z.object({
  email: z.email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const updateProfileSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(80, "Name must be less than 80 characters"),
});

export const passwordUpdateSchema = z
  .object({
    currentPassword: z
      .string()
      .min(6, "Current password must be at least 6 characters"),
    newPassword: z
      .string()
      .min(6, "New password must be at least 6 characters"),
    confirmNewPassword: z
      .string()
      .min(6, "Confirm new password must be at least 6 characters"),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "New password and confirm new password must match",
  });

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type PasswordUpdateInput = z.infer<typeof passwordUpdateSchema>;
