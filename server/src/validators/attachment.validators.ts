import { z } from "zod";
import { ALLOWED_MIME_TYPES, getMaxFileSizeBytes } from "../config/storage.js";

const emptyIfMissing = (value: unknown) =>
  value === undefined || value === null ? "" : value;

export const requestUploadUrlSchema = z
  .object({
    fileName: z.preprocess(
      emptyIfMissing,
      z
        .string()
        .trim()
        .min(1, "File name is required")
        .max(255, "File name must be 255 characters or fewer"),
    ),
    mimeType: z.enum(ALLOWED_MIME_TYPES, {
      message: "Unsupported file type. Allowed: PDF, JPG, PNG, WebP",
    }),
    fileSize: z.coerce
      .number({ message: "File size is required" })
      .int("File size must be a whole number")
      .positive("File size must be greater than 0"),
  })
  .superRefine((data, ctx) => {
    const maxBytes = getMaxFileSizeBytes();

    if (data.fileSize > maxBytes) {
      const maxMb = Math.round(maxBytes / (1024 * 1024));
      ctx.addIssue({
        code: "custom",
        path: ["fileSize"],
        message: `File is too large. Maximum size is ${maxMb} MB`,
      });
    }
  });

export const confirmAttachmentSchema = z.object({
  storageKey: z.preprocess(
    emptyIfMissing,
    z.string().trim().min(1, "Storage key is required").max(500),
  ),
  fileName: z.preprocess(
    emptyIfMissing,
    z
      .string()
      .trim()
      .min(1, "File name is required")
      .max(255, "File name must be 255 characters or fewer"),
  ),
  mimeType: z.enum(ALLOWED_MIME_TYPES, {
    message: "Unsupported file type. Allowed: PDF, JPG, PNG, WebP",
  }),
  fileSize: z.coerce
    .number({ message: "File size is required" })
    .int("File size must be a whole number")
    .positive("File size must be greater than 0"),
});

export type RequestUploadUrlInput = z.infer<typeof requestUploadUrlSchema>;
export type ConfirmAttachmentInput = z.infer<typeof confirmAttachmentSchema>;
