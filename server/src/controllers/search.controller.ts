import type { NextFunction, Request, Response } from "express";
import { AppError } from "../middlewares/AppError.js";
import { searchWallet, type SearchResponse } from "../services/search.service.js";
import type { ApiSuccessResponse } from "../types/api.types.js";
import { requireUserId } from "../utils/auth.js";
import { formatZodError } from "../utils/validation.js";
import { searchQuerySchema } from "../validators/search.validators.js";

const queryValue = (value: unknown): string | undefined => {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value) && typeof value[0] === "string") {
    return value[0];
  }

  return undefined;
};

export const searchHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = requireUserId(req.user?.id);
    const parsed = searchQuerySchema.safeParse({
      q: queryValue(req.query.q),
      tripStatus: queryValue(req.query.tripStatus),
      category: queryValue(req.query.category),
      expiry: queryValue(req.query.expiry),
      dateFrom: queryValue(req.query.dateFrom),
      dateTo: queryValue(req.query.dateTo),
    });

    if (!parsed.success) {
      throw new AppError(formatZodError(parsed.error), 400);
    }

    const data = await searchWallet(userId, parsed.data);
    const response: ApiSuccessResponse<SearchResponse> = {
      success: true,
      data,
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};
