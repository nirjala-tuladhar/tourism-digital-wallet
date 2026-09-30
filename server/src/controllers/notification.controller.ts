import type { NextFunction, Request, Response } from "express";
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationListResponse,
  type NotificationResponse,
} from "../services/notification.service.js";
import type { ApiSuccessResponse } from "../types/api.types.js";
import { requireUserId } from "../utils/auth.js";

export const listNotificationsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = requireUserId(req.user?.id);
    const data = await listNotifications(userId);
    const response: ApiSuccessResponse<NotificationListResponse> = {
      success: true,
      data,
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const markNotificationReadHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = requireUserId(req.user?.id);
    const notification = await markNotificationRead(
      String(req.params.id),
      userId,
    );
    const response: ApiSuccessResponse<NotificationResponse> = {
      success: true,
      data: notification,
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const markAllNotificationsReadHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = requireUserId(req.user?.id);
    const data = await markAllNotificationsRead(userId);
    const response: ApiSuccessResponse<{ updated: number }> = {
      success: true,
      data,
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};
