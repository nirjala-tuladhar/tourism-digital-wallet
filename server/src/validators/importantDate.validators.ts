import { z } from "zod";
import { IMPORTANT_DATE_TYPES } from "../models/ImportantDate.js";

const emptyIfMissing = (value: unknown) =>
  value === undefined || value === null ? "" : value;

export const createImportantDateSchema = z.object({
  title: z.preprocess(
    emptyIfMissing,
    z
      .string()
      .trim()
      .min(1, "Title is required")
      .max(160, "Title must be 160 characters or fewer"),
  ),
  date: z.preprocess(
    emptyIfMissing,
    z
      .string()
      .min(1, "Date is required")
      .refine((value) => !Number.isNaN(Date.parse(value)), {
        message: "Date must be a valid date",
      }),
  ),
  type: z.enum(IMPORTANT_DATE_TYPES, {
    message: "Please select a valid date type",
  }),
  description: z
    .string()
    .trim()
    .max(2000, "Description must be 2000 characters or fewer")
    .optional()
    .or(z.literal("")),
  travelItemId: z
    .string()
    .trim()
    .min(1)
    .optional()
    .or(z.literal(""))
    .nullable(),
});

export const updateImportantDateSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(160, "Title must be 160 characters or fewer")
    .optional(),
  date: z
    .string()
    .min(1, "Date is required")
    .refine((value) => !Number.isNaN(Date.parse(value)), {
      message: "Date must be a valid date",
    })
    .optional(),
  type: z
    .enum(IMPORTANT_DATE_TYPES, {
      message: "Please select a valid date type",
    })
    .optional(),
  description: z
    .string()
    .trim()
    .max(2000, "Description must be 2000 characters or fewer")
    .optional()
    .nullable(),
  travelItemId: z
    .string()
    .trim()
    .min(1)
    .optional()
    .nullable()
    .or(z.literal("")),
});

export type CreateImportantDateInput = z.infer<typeof createImportantDateSchema>;
export type UpdateImportantDateInput = z.infer<typeof updateImportantDateSchema>;
