import { z } from "zod";
import { TRIP_STATUSES } from "../models/Trip.js";

const emptyIfMissing = (value: unknown) =>
  value === undefined || value === null ? "" : value;

const dateField = (label: string) =>
  z.preprocess(
    emptyIfMissing,
    z
      .string()
      .min(1, `${label} is required`)
      .refine((value) => !Number.isNaN(Date.parse(value)), {
        message: `${label} must be a valid date`,
      }),
  );

export const createTripSchema = z
  .object({
    name: z.preprocess(
      emptyIfMissing,
      z
        .string()
        .trim()
        .min(1, "Trip name is required")
        .max(120, "Trip name must be 120 characters or fewer"),
    ),
    origin: z.preprocess(
      emptyIfMissing,
      z
        .string()
        .trim()
        .min(1, "Origin is required")
        .max(120, "Origin must be 120 characters or fewer"),
    ),
    destination: z.preprocess(
      emptyIfMissing,
      z
        .string()
        .trim()
        .min(1, "Destination is required")
        .max(120, "Destination must be 120 characters or fewer"),
    ),
    startDate: dateField("Start date"),
    endDate: dateField("End date"),
    description: z
      .string()
      .trim()
      .max(2000, "Description must be 2000 characters or fewer")
      .optional()
      .or(z.literal("")),
    status: z.enum(TRIP_STATUSES).optional(),
  })
  .superRefine((data, ctx) => {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);

    if (end < start) {
      ctx.addIssue({
        code: "custom",
        path: ["endDate"],
        message: "End date must not be before start date",
      });
    }
  });

export const updateTripSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Trip name is required")
      .max(120, "Trip name must be 120 characters or fewer")
      .optional(),
    origin: z
      .string()
      .trim()
      .min(1, "Origin is required")
      .max(120, "Origin must be 120 characters or fewer")
      .optional(),
    destination: z
      .string()
      .trim()
      .min(1, "Destination is required")
      .max(120, "Destination must be 120 characters or fewer")
      .optional(),
    startDate: z
      .string()
      .min(1, "Start date is required")
      .refine((value) => !Number.isNaN(Date.parse(value)), {
        message: "Start date must be a valid date",
      })
      .optional(),
    endDate: z
      .string()
      .min(1, "End date is required")
      .refine((value) => !Number.isNaN(Date.parse(value)), {
        message: "End date must be a valid date",
      })
      .optional(),
    description: z
      .string()
      .trim()
      .max(2000, "Description must be 2000 characters or fewer")
      .optional()
      .nullable(),
    status: z.enum(TRIP_STATUSES).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.startDate && data.endDate) {
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);

      if (end < start) {
        ctx.addIssue({
          code: "custom",
          path: ["endDate"],
          message: "End date must not be before start date",
        });
      }
    }
  });

export type CreateTripInput = z.infer<typeof createTripSchema>;
export type UpdateTripInput = z.infer<typeof updateTripSchema>;
