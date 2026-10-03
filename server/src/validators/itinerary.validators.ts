import { z } from "zod";

const optionalText = (max: number) =>
  z.union([z.string().trim().max(max), z.literal(""), z.null()]).optional();

const timeField = z
  .union([
    z.string().trim().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Time must use HH:mm"),
    z.literal(""),
    z.null(),
  ])
  .optional();

const itineraryFields = {
  date: z
    .string()
    .min(1, "Date is required")
    .refine((value) => !Number.isNaN(Date.parse(value)), "Date must be a valid date"),
  time: timeField,
  title: z.string().trim().min(1, "Title is required").max(160),
  location: optionalText(160),
  description: optionalText(2000),
  travelItemId: z.union([z.string().trim(), z.literal(""), z.null()]).optional(),
};

export const createItinerarySchema = z.object(itineraryFields);

export const updateItinerarySchema = z.object({
  date: itineraryFields.date.optional(),
  time: timeField.optional().nullable(),
  title: itineraryFields.title.optional(),
  location: z.string().trim().max(160).optional().nullable(),
  description: z.string().trim().max(2000).optional().nullable(),
  travelItemId: z.string().trim().optional().nullable().or(z.literal("")),
});

export type CreateItineraryInput = z.infer<typeof createItinerarySchema>;
export type UpdateItineraryInput = z.infer<typeof updateItinerarySchema>;
