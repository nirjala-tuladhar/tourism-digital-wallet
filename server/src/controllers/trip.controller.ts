import type { NextFunction, Request, Response } from "express";
import { AppError } from "../middlewares/AppError.js";
import type { ApiSuccessResponse } from "../types/api.types.js";
import { requireUserId } from "../utils/auth.js";
import { formatZodError } from "../utils/validation.js";
import {
  createTrip,
  deleteTrip,
  getTripById,
  listTrips,
  updateTrip,
  type TripResponse,
} from "../services/trip.service.js";
import {
  createTripSchema,
  updateTripSchema,
} from "../validators/trip.validators.js";

export const createTripHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = requireUserId(req.user?.id);
    const parsed = createTripSchema.safeParse(req.body);

    if (!parsed.success) {
      throw new AppError(formatZodError(parsed.error), 400);
    }

    const trip = await createTrip(userId, parsed.data);
    const response: ApiSuccessResponse<TripResponse> = {
      success: true,
      data: trip,
    };

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
};

export const listTripsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = requireUserId(req.user?.id);
    const trips = await listTrips(userId);
    const response: ApiSuccessResponse<TripResponse[]> = {
      success: true,
      data: trips,
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const getTripHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = requireUserId(req.user?.id);
    const trip = await getTripById(String(req.params.id), userId);
    const response: ApiSuccessResponse<TripResponse> = {
      success: true,
      data: trip,
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const updateTripHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = requireUserId(req.user?.id);
    const parsed = updateTripSchema.safeParse(req.body);

    if (!parsed.success) {
      throw new AppError(formatZodError(parsed.error), 400);
    }

    const trip = await updateTrip(String(req.params.id), userId, parsed.data);
    const response: ApiSuccessResponse<TripResponse> = {
      success: true,
      data: trip,
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const deleteTripHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = requireUserId(req.user?.id);
    await deleteTrip(String(req.params.id), userId);

    const response: ApiSuccessResponse<{ message: string }> = {
      success: true,
      data: { message: "Trip deleted successfully" },
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};
