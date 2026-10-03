import { z } from "zod";
import { EXPENSE_CATEGORIES } from "../models/Expense.js";

const amountField = z.number().positive("Amount must be greater than 0").max(1_000_000_000);
const currencyField = z
  .string()
  .trim()
  .length(3, "Currency must be a 3-letter code")
  .regex(/^[A-Za-z]{3}$/, "Currency must be a 3-letter code");

export const createExpenseSchema = z.object({
  amount: amountField,
  currency: currencyField,
  category: z.enum(EXPENSE_CATEGORIES),
  date: z
    .string()
    .min(1, "Date is required")
    .refine((value) => !Number.isNaN(Date.parse(value)), "Date must be a valid date"),
  description: z.string().trim().max(500).optional().or(z.literal("")),
});

export const updateExpenseSchema = z.object({
  amount: amountField.optional(),
  currency: currencyField.optional(),
  category: z.enum(EXPENSE_CATEGORIES).optional(),
  date: z
    .string()
    .min(1, "Date is required")
    .refine((value) => !Number.isNaN(Date.parse(value)), "Date must be a valid date")
    .optional(),
  description: z.string().trim().max(500).optional().nullable(),
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
