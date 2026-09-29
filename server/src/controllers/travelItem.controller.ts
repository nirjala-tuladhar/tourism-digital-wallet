import type { NextFunction, Request, Response } from "express";
import { AppError } from "../middlewares/AppError.js";
import type { ApiSuccessResponse } from "../types/api.types.js";
import { requireUserId } from "../utils/auth.js";
import { formatZodError } from "../utils/validation.js";
import {
  createTravelItem,
  deleteTravelItem,
  getTravelItemById,
  listTravelItems,
  updateTravelItem,
  type TravelItemResponse,
} from "../services/travelItem.service.js";
import {
  createTravelItemSchema,
  updateTravelItemSchema,
} from "../validators/travelItem.validators.js";

export const createTravelItemHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = requireUserId(req.user?.id);
    const parsed = createTravelItemSchema.safeParse(req.body);

    if (!parsed.success) {
      throw new AppError(formatZodError(parsed.error), 400);
    }

    const item = await createTravelItem(
      String(req.params.tripId),
      userId,
      parsed.data,
    );

    const response: ApiSuccessResponse<TravelItemResponse> = {
      success: true,
      data: item,
    };

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
};

export const listTravelItemsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = requireUserId(req.user?.id);
    const items = await listTravelItems(String(req.params.tripId), userId);
    const response: ApiSuccessResponse<TravelItemResponse[]> = {
      success: true,
      data: items,
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const getTravelItemHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = requireUserId(req.user?.id);
    const item = await getTravelItemById(
      String(req.params.tripId),
      String(req.params.itemId),
      userId,
    );
    const response: ApiSuccessResponse<TravelItemResponse> = {
      success: true,
      data: item,
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const updateTravelItemHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = requireUserId(req.user?.id);
    const parsed = updateTravelItemSchema.safeParse(req.body);

    if (!parsed.success) {
      throw new AppError(formatZodError(parsed.error), 400);
    }

    const item = await updateTravelItem(
      String(req.params.tripId),
      String(req.params.itemId),
      userId,
      parsed.data,
    );

    const response: ApiSuccessResponse<TravelItemResponse> = {
      success: true,
      data: item,
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const deleteTravelItemHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = requireUserId(req.user?.id);
    await deleteTravelItem(
      String(req.params.tripId),
      String(req.params.itemId),
      userId,
    );

    const response: ApiSuccessResponse<{ message: string }> = {
      success: true,
      data: { message: "Travel item deleted successfully" },
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};
