import type { NextFunction, Request, Response } from "express";
import {
  getUserById,
  loginUser,
  registerUser,
} from "../services/auth.service.js";
import type { ApiSuccessResponse } from "../types/api.types.js";
import {
  loginSchema,
  registerSchema,
} from "../validators/auth.validators.js";
import { AppError } from "../middlewares/AppError.js";

type AuthData = {
  user: {
    id: string;
    name: string;
    email: string;
  };
  token: string;
};

const formatZodError = (error: {
  issues: Array<{ message: string }>;
}): string => {
  return error.issues[0]?.message || "Invalid request data";
};

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const parsed = registerSchema.safeParse(req.body);

    if (!parsed.success) {
      throw new AppError(formatZodError(parsed.error), 400);
    }

    const result = await registerUser(parsed.data);

    const response: ApiSuccessResponse<AuthData> = {
      success: true,
      data: result,
    };

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const parsed = loginSchema.safeParse(req.body);

    if (!parsed.success) {
      throw new AppError(formatZodError(parsed.error), 400);
    }

    const result = await loginUser(parsed.data);

    const response: ApiSuccessResponse<AuthData> = {
      success: true,
      data: result,
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const me = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user?.id) {
      throw new AppError("Authentication required", 401);
    }

    const user = await getUserById(req.user.id);

    const response: ApiSuccessResponse<{ user: typeof user }> = {
      success: true,
      data: { user },
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const logout = async (
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const response: ApiSuccessResponse<{ message: string }> = {
      success: true,
      data: { message: "Logged out successfully" },
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};
