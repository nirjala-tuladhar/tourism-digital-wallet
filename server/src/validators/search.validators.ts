import { z } from "zod";
import { TRAVEL_ITEM_CATEGORIES } from "../models/TravelItem.js";
import { optionalDateField } from "./date.validators.js";

export const searchQuerySchema = z
  .object({
    q: z.string().trim().max(120, "Search must be 120 characters or fewer").optional(),
    tripStatus: z.enum(["all", "upcoming", "active", "completed", "cancelled", "inactive"]).optional().default("all"),
    category: z.enum(TRAVEL_ITEM_CATEGORIES).optional(),
    expiry: z.enum(["all", "none", "soon", "expired"]).optional().default("all"),
    dateFrom: optionalDateField,
    dateTo: optionalDateField,
  })
  .superRefine((data, ctx) => {
    if (data.dateFrom && data.dateTo) {
      const from = new Date(data.dateFrom);
      const to = new Date(data.dateTo);

      if (to < from) {
        ctx.addIssue({
          code: "custom",
          path: ["dateTo"],
          message: "End date must not be before start date",
        });
      }
    }
  });

export type SearchQueryInput = z.infer<typeof searchQuerySchema>;
