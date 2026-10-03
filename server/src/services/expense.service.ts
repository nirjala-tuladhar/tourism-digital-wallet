import mongoose from "mongoose";
import { parseDateOnly } from "../config/expiry.js";
import { AppError } from "../middlewares/AppError.js";
import { Expense, type ExpenseDocument } from "../models/Expense.js";
import { Trip, normalizeTripStatus, type TripStatus } from "../models/Trip.js";
import { assertValidObjectId } from "../utils/auth.js";
import { getOwnedTripOrThrow } from "./trip.service.js";
import type { CreateExpenseInput, UpdateExpenseInput } from "../validators/expense.validators.js";

export type ExpenseResponse = {
  id: string;
  userId: string;
  tripId: string;
  amount: number;
  currency: string;
  category: string;
  date: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
};

const toResponse = (expense: ExpenseDocument): ExpenseResponse => ({
  id: String(expense._id),
  userId: String(expense.userId),
  tripId: String(expense.tripId),
  amount: expense.amount,
  currency: expense.currency,
  category: expense.category,
  date: expense.date.toISOString(),
  description: expense.description || undefined,
  createdAt: expense.createdAt.toISOString(),
  updatedAt: expense.updatedAt.toISOString(),
});

export type ExpenseBoardTrip = {
  id: string;
  name: string;
  origin: string;
  destination: string;
  status: TripStatus;
  startDate: string;
  endDate: string;
  budgetAmount: number | null;
  budgetCurrency: string | null;
  expenseCount: number;
  spent: Array<{ currency: string; amount: number }>;
};

const statusRank = (status: TripStatus): number => {
  if (status === "active") return 0;
  if (status === "upcoming") return 1;
  if (status === "completed") return 2;
  return 3;
};

export const listExpenseBoard = async (userId: string): Promise<ExpenseBoardTrip[]> => {
  const [trips, totals] = await Promise.all([
    Trip.find({ userId }),
    Expense.aggregate<{
      _id: { tripId: mongoose.Types.ObjectId; currency: string };
      total: number;
      count: number;
    }>([
      {
        $match: {
          $or: [{ userId: new mongoose.Types.ObjectId(userId) }, { userId }],
        },
      },
      {
        $group: {
          _id: { tripId: "$tripId", currency: "$currency" },
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  const byTrip = new Map<string, { count: number; spent: Array<{ currency: string; amount: number }> }>();

  for (const row of totals) {
    const tripId = String(row._id.tripId);
    const current = byTrip.get(tripId) ?? { count: 0, spent: [] };
    const currency = String(row._id.currency ?? "").trim().toUpperCase();
    const amount = Number(row.total);
    const existing = current.spent.find((entry) => entry.currency === currency);
    current.count += row.count;
    if (existing) {
      existing.amount += amount;
    } else if (currency) {
      current.spent.push({ currency, amount });
    }
    byTrip.set(tripId, current);
  }

  return trips
    .map((trip) => {
      const summary = byTrip.get(String(trip._id));
      return {
        id: String(trip._id),
        name: trip.name,
        origin: trip.origin,
        destination: trip.destination,
        status: normalizeTripStatus(String(trip.status)),
        startDate: trip.startDate.toISOString(),
        endDate: trip.endDate.toISOString(),
        budgetAmount: trip.budgetAmount ?? null,
        budgetCurrency: trip.budgetCurrency ?? null,
        expenseCount: summary?.count ?? 0,
        spent: (summary?.spent ?? []).sort((left, right) => left.currency.localeCompare(right.currency)),
      };
    })
    .sort(
      (left, right) =>
        statusRank(left.status) - statusRank(right.status) ||
        new Date(left.startDate).getTime() - new Date(right.startDate).getTime(),
    );
};

export const listExpenses = async (
  tripId: string,
  userId: string,
): Promise<ExpenseResponse[]> => {
  await getOwnedTripOrThrow(tripId, userId);
  const expenses = await Expense.find({ tripId, userId }).sort({ date: -1, createdAt: -1 });
  return expenses.map(toResponse);
};

export const createExpense = async (
  tripId: string,
  userId: string,
  input: CreateExpenseInput,
): Promise<ExpenseResponse> => {
  const trip = await getOwnedTripOrThrow(tripId, userId);
  const expense = await Expense.create({
    userId,
    tripId: trip._id,
    amount: input.amount,
    currency: input.currency.toUpperCase(),
    category: input.category,
    date: parseDateOnly(input.date),
    description: input.description?.trim() || undefined,
  });

  return toResponse(expense);
};

export const updateExpense = async (
  tripId: string,
  expenseId: string,
  userId: string,
  input: UpdateExpenseInput,
): Promise<ExpenseResponse> => {
  await getOwnedTripOrThrow(tripId, userId);
  assertValidObjectId(expenseId, "Expense");
  const expense = await Expense.findOne({ _id: expenseId, tripId, userId });

  if (!expense) {
    throw new AppError("Expense not found", 404);
  }

  if (input.amount !== undefined) expense.amount = input.amount;
  if (input.currency !== undefined) expense.currency = input.currency.toUpperCase();
  if (input.category !== undefined) expense.category = input.category;
  if (input.date !== undefined) expense.date = parseDateOnly(input.date);
  if (input.description !== undefined) {
    expense.description = input.description?.trim() || undefined;
  }

  await expense.save();
  return toResponse(expense);
};

export const deleteExpense = async (
  tripId: string,
  expenseId: string,
  userId: string,
): Promise<void> => {
  await getOwnedTripOrThrow(tripId, userId);
  assertValidObjectId(expenseId, "Expense");
  const expense = await Expense.findOne({ _id: expenseId, tripId, userId });

  if (!expense) {
    throw new AppError("Expense not found", 404);
  }

  await expense.deleteOne();
};
