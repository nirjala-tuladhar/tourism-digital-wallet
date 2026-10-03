import { z } from "zod";

export const createChecklistSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(160),
});

export const updateChecklistSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(160).optional(),
  completed: z.boolean().optional(),
});

export const reorderChecklistSchema = z.object({
  orderedIds: z.array(z.string().trim().min(1)).min(1, "Order is required"),
});

export type CreateChecklistInput = z.infer<typeof createChecklistSchema>;
export type UpdateChecklistInput = z.infer<typeof updateChecklistSchema>;
export type ReorderChecklistInput = z.infer<typeof reorderChecklistSchema>;
