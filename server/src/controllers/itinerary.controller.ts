import type { NextFunction, Request, Response } from "express";
import { AppError } from "../middlewares/AppError.js";
import type { ApiSuccessResponse } from "../types/api.types.js";
import { requireUserId } from "../utils/auth.js";
import { formatZodError } from "../utils/validation.js";
import {
  createItineraryItem,
  deleteItineraryItem,
  listItinerary,
  updateItineraryItem,
  type ItineraryResponse,
} from "../services/itinerary.service.js";
import {
  createItinerarySchema,
  updateItinerarySchema,
} from "../validators/itinerary.validators.js";

export const listItineraryHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = requireUserId(req.user?.id);
    const items = await listItinerary(String(req.params.tripId), userId);
    const response: ApiSuccessResponse<ItineraryResponse[]> = { success: true, data: items };
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const createItineraryHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = requireUserId(req.user?.id);
    const parsed = createItinerarySchema.safeParse(req.body);
    if (!parsed.success) throw new AppError(formatZodError(parsed.error), 400);
    const item = await createItineraryItem(String(req.params.tripId), userId, parsed.data);
    const response: ApiSuccessResponse<ItineraryResponse> = { success: true, data: item };
    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
};

export const updateItineraryHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = requireUserId(req.user?.id);
    const parsed = updateItinerarySchema.safeParse(req.body);
    if (!parsed.success) throw new AppError(formatZodError(parsed.error), 400);
    const item = await updateItineraryItem(
      String(req.params.tripId),
      String(req.params.itemId),
      userId,
      parsed.data,
    );
    const response: ApiSuccessResponse<ItineraryResponse> = { success: true, data: item };
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const deleteItineraryHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = requireUserId(req.user?.id);
    await deleteItineraryItem(String(req.params.tripId), String(req.params.itemId), userId);
    const response: ApiSuccessResponse<{ message: string }> = {
      success: true,
      data: { message: "Itinerary item deleted" },
    };
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};
