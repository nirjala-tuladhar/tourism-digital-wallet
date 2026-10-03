import mongoose, { HydratedDocument, Schema, Types } from "mongoose";

export const EXPENSE_CATEGORIES = [
  "Accommodation",
  "Transportation",
  "Food",
  "Activities",
  "Shopping",
  "Other",
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export type ExpenseAttrs = {
  userId: Types.ObjectId;
  tripId: Types.ObjectId;
  amount: number;
  currency: string;
  category: ExpenseCategory;
  date: Date;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type ExpenseDocument = HydratedDocument<ExpenseAttrs>;

const expenseSchema = new Schema<ExpenseAttrs>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    tripId: {
      type: Schema.Types.ObjectId,
      ref: "Trip",
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      minlength: 3,
      maxlength: 3,
    },
    category: {
      type: String,
      enum: EXPENSE_CATEGORIES,
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
  },
  { timestamps: true },
);

expenseSchema.index({ tripId: 1, userId: 1, date: -1 });
expenseSchema.index({ userId: 1, date: -1 });

export const Expense = mongoose.model<ExpenseAttrs>("Expense", expenseSchema);
