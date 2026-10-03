import { z } from "zod";
import { TRAVEL_ITEM_CATEGORIES } from "../models/TravelItem.js";
import { optionalDateField } from "./date.validators.js";

const emptyIfMissing = (value: unknown) =>
  value === undefined || value === null ? "" : value;

const reminderDaysField = z
  .array(z.union([z.literal(30), z.literal(7), z.literal(1), z.literal(0)]))
  .max(4)
  .optional();

const customReminderDatesField = z
  .array(
    z
      .string()
      .min(1)
      .refine((value) => !Number.isNaN(Date.parse(value)), "Reminder date must be valid"),
  )
  .max(5)
  .optional();

const reminderShape = {
  important: z.boolean().optional(),
  reminderMode: z.enum(["default", "custom"]).optional(),
  reminderDays: reminderDaysField,
  customReminderDates: customReminderDatesField,
};

const requireCustomReminder = (
  data: {
    reminderMode?: "default" | "custom";
    reminderDays?: number[];
    customReminderDates?: string[];
  },
  ctx: z.RefinementCtx,
) => {
  if (data.reminderMode !== "custom") {
    return;
  }

  const hasPreset = (data.reminderDays?.length ?? 0) > 0;
  const hasCustom = (data.customReminderDates?.length ?? 0) > 0;

  if (!hasPreset && !hasCustom) {
    ctx.addIssue({
      code: "custom",
      path: ["reminderDays"],
      message: "Select at least one reminder",
    });
  }
};
export const createTravelItemSchema = z.object({
  title: z.preprocess(
    emptyIfMissing,
    z
      .string()
      .trim()
      .min(1, "Title is required")
      .max(160, "Title must be 160 characters or fewer"),
  ),
  category: z.enum(TRAVEL_ITEM_CATEGORIES, {
    message: "Please select a valid category",
  }),
  description: z
    .string()
    .trim()
    .max(2000, "Description must be 2000 characters or fewer")
    .optional()
    .or(z.literal("")),
  labels: z
    .array(
      z
        .string()
        .trim()
        .min(1, "Label cannot be empty")
        .max(40, "Label must be 40 characters or fewer"),
    )
    .max(10, "You can add up to 10 labels")
    .optional(),
  expiresAt: optionalDateField,
  ...reminderShape,
}).superRefine(requireCustomReminder);

export const updateTravelItemSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(160, "Title must be 160 characters or fewer")
    .optional(),
  category: z
    .enum(TRAVEL_ITEM_CATEGORIES, {
      message: "Please select a valid category",
    })
    .optional(),
  description: z
    .string()
    .trim()
    .max(2000, "Description must be 2000 characters or fewer")
    .optional()
    .nullable(),
  labels: z
    .array(
      z
        .string()
        .trim()
        .min(1, "Label cannot be empty")
        .max(40, "Label must be 40 characters or fewer"),
    )
    .max(10, "You can add up to 10 labels")
    .optional(),
  expiresAt: optionalDateField,
  ...reminderShape,
}).superRefine(requireCustomReminder);

export type CreateTravelItemInput = z.infer<typeof createTravelItemSchema>;
export type UpdateTravelItemInput = z.infer<typeof updateTravelItemSchema>;
