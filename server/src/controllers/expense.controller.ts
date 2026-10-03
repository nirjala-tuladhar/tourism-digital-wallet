import type { NextFunction, Request, Response } from "express";
import { AppError } from "../middlewares/AppError.js";
import type { ApiSuccessResponse } from "../types/api.types.js";
import { requireUserId } from "../utils/auth.js";
import { formatZodError } from "../utils/validation.js";
import {
  createExpense,
  deleteExpense,
  listExpenseBoard,
  listExpenses,
  updateExpense,
  type ExpenseBoardTrip,
  type ExpenseResponse,
} from "../services/expense.service.js";
import { createExpenseSchema, updateExpenseSchema } from "../validators/expense.validators.js";

export const listExpenseBoardHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = requireUserId(req.user?.id);
    const trips = await listExpenseBoard(userId);
    const response: ApiSuccessResponse<ExpenseBoardTrip[]> = { success: true, data: trips };
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const listExpensesHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = requireUserId(req.user?.id);
    const expenses = await listExpenses(String(req.params.tripId), userId);
    const response: ApiSuccessResponse<ExpenseResponse[]> = { success: true, data: expenses };
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const createExpenseHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = requireUserId(req.user?.id);
    const parsed = createExpenseSchema.safeParse(req.body);
    if (!parsed.success) throw new AppError(formatZodError(parsed.error), 400);
    const expense = await createExpense(String(req.params.tripId), userId, parsed.data);
    const response: ApiSuccessResponse<ExpenseResponse> = { success: true, data: expense };
    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
};

export const updateExpenseHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = requireUserId(req.user?.id);
    const parsed = updateExpenseSchema.safeParse(req.body);
    if (!parsed.success) throw new AppError(formatZodError(parsed.error), 400);
    const expense = await updateExpense(
      String(req.params.tripId),
      String(req.params.expenseId),
      userId,
      parsed.data,
    );
    const response: ApiSuccessResponse<ExpenseResponse> = { success: true, data: expense };
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const deleteExpenseHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = requireUserId(req.user?.id);
    await deleteExpense(String(req.params.tripId), String(req.params.expenseId), userId);
    const response: ApiSuccessResponse<{ message: string }> = {
      success: true,
      data: { message: "Expense deleted" },
    };
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};
