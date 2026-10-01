import { z } from "zod";

const emptyIfMissing = (value: unknown) =>
  value === undefined || value === null ? "" : value;

export const registerSchema = z.object({
  name: z.preprocess(
    emptyIfMissing,
    z
      .string()
      .trim()
      .min(1, "Name is required")
      .max(100, "Name must be 100 characters or fewer"),
  ),
  email: z.preprocess(
    emptyIfMissing,
    z
      .string()
      .trim()
      .min(1, "Email is required")
      .email("Please enter a valid email address"),
  ),
  password: z.preprocess(
    emptyIfMissing,
    z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128, "Password must be 128 characters or fewer"),
  ),
});

export const loginSchema = z.object({
  email: z.preprocess(
    emptyIfMissing,
    z
      .string()
      .trim()
      .min(1, "Email is required")
      .email("Please enter a valid email address"),
  ),
  password: z.preprocess(
    emptyIfMissing,
    z.string().min(1, "Password is required"),
  ),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

export const updateProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(100, "Name must be 100 characters or fewer"),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128, "Password must be 128 characters or fewer"),
  })
  .superRefine((data, ctx) => {
    if (data.currentPassword === data.newPassword) {
      ctx.addIssue({
        code: "custom",
        path: ["newPassword"],
        message: "New password must be different from the current password",
      });
    }
  });

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
