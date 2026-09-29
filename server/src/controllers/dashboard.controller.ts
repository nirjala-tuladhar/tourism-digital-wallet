import type { NextFunction, Request, Response } from "express";
import type { ApiSuccessResponse } from "../types/api.types.js";
import { requireUserId } from "../utils/auth.js";
import {
  getDashboard,
  type DashboardResponse,
} from "../services/dashboard.service.js";

export const getDashboardHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = requireUserId(req.user?.id);
    const dashboard = await getDashboard(userId);
    const response: ApiSuccessResponse<DashboardResponse> = {
      success: true,
      data: dashboard,
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};
