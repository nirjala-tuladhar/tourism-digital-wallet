import type { NextFunction, Request, Response } from "express";
import { AppError } from "../middlewares/AppError.js";
import type { ApiSuccessResponse } from "../types/api.types.js";
import { requireUserId } from "../utils/auth.js";
import { formatZodError } from "../utils/validation.js";
import {
  createChecklistItem,
  deleteChecklistItem,
  listChecklist,
  reorderChecklist,
  updateChecklistItem,
  type ChecklistResponse,
} from "../services/checklist.service.js";
import {
  createChecklistSchema,
  reorderChecklistSchema,
  updateChecklistSchema,
} from "../validators/checklist.validators.js";

export const listChecklistHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = requireUserId(req.user?.id);
    const items = await listChecklist(String(req.params.tripId), userId);
    const response: ApiSuccessResponse<ChecklistResponse[]> = { success: true, data: items };
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const createChecklistHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = requireUserId(req.user?.id);
    const parsed = createChecklistSchema.safeParse(req.body);
    if (!parsed.success) throw new AppError(formatZodError(parsed.error), 400);
    const item = await createChecklistItem(String(req.params.tripId), userId, parsed.data);
    const response: ApiSuccessResponse<ChecklistResponse> = { success: true, data: item };
    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
};

export const updateChecklistHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = requireUserId(req.user?.id);
    const parsed = updateChecklistSchema.safeParse(req.body);
    if (!parsed.success) throw new AppError(formatZodError(parsed.error), 400);
    const item = await updateChecklistItem(
      String(req.params.tripId),
      String(req.params.itemId),
      userId,
      parsed.data,
    );
    const response: ApiSuccessResponse<ChecklistResponse> = { success: true, data: item };
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const reorderChecklistHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = requireUserId(req.user?.id);
    const parsed = reorderChecklistSchema.safeParse(req.body);
    if (!parsed.success) throw new AppError(formatZodError(parsed.error), 400);
    const items = await reorderChecklist(String(req.params.tripId), userId, parsed.data);
    const response: ApiSuccessResponse<ChecklistResponse[]> = { success: true, data: items };
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const deleteChecklistHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = requireUserId(req.user?.id);
    await deleteChecklistItem(String(req.params.tripId), String(req.params.itemId), userId);
    const response: ApiSuccessResponse<{ message: string }> = {
      success: true,
      data: { message: "Checklist item deleted" },
    };
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};
