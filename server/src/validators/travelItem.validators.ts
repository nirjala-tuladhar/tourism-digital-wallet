import { z } from "zod";
import { TRAVEL_ITEM_CATEGORIES } from "../models/TravelItem.js";
import { optionalDateField } from "./date.validators.js";

const emptyIfMissing = (value: unknown) =>
  value === undefined || value === null ? "" : value;

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
});

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
});

export type CreateTravelItemInput = z.infer<typeof createTravelItemSchema>;
export type UpdateTravelItemInput = z.infer<typeof updateTravelItemSchema>;
