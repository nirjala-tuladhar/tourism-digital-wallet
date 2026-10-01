import type { NextFunction, Request, Response } from "express";
import { AppError } from "../middlewares/AppError.js";
import type { ApiSuccessResponse } from "../types/api.types.js";
import { requireUserId } from "../utils/auth.js";
import { formatZodError } from "../utils/validation.js";
import {
  createImportantDate,
  deleteImportantDate,
  getImportantDateById,
  listImportantDates,
  updateImportantDate,
  type ImportantDateResponse,
} from "../services/importantDate.service.js";
import {
  createImportantDateSchema,
  updateImportantDateSchema,
} from "../validators/importantDate.validators.js";

export const createImportantDateHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = requireUserId(req.user?.id);
    const parsed = createImportantDateSchema.safeParse(req.body);

    if (!parsed.success) {
      throw new AppError(formatZodError(parsed.error), 400);
    }

    const entry = await createImportantDate(
      String(req.params.tripId),
      userId,
      parsed.data,
    );

    const response: ApiSuccessResponse<ImportantDateResponse> = {
      success: true,
      data: entry,
    };

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
};

export const listImportantDatesHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = requireUserId(req.user?.id);
    const entries = await listImportantDates(String(req.params.tripId), userId);
    const response: ApiSuccessResponse<ImportantDateResponse[]> = {
      success: true,
      data: entries,
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const getImportantDateHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = requireUserId(req.user?.id);
    const entry = await getImportantDateById(
      String(req.params.tripId),
      String(req.params.dateId),
      userId,
    );
    const response: ApiSuccessResponse<ImportantDateResponse> = {
      success: true,
      data: entry,
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const updateImportantDateHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = requireUserId(req.user?.id);
    const parsed = updateImportantDateSchema.safeParse(req.body);

    if (!parsed.success) {
      throw new AppError(formatZodError(parsed.error), 400);
    }

    const entry = await updateImportantDate(
      String(req.params.tripId),
      String(req.params.dateId),
      userId,
      parsed.data,
    );

    const response: ApiSuccessResponse<ImportantDateResponse> = {
      success: true,
      data: entry,
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const deleteImportantDateHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = requireUserId(req.user?.id);
    await deleteImportantDate(
      String(req.params.tripId),
      String(req.params.dateId),
      userId,
    );

    const response: ApiSuccessResponse<{ message: string }> = {
      success: true,
      data: { message: "Important date deleted successfully" },
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};
