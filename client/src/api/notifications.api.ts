import { apiClient } from "./client";
import type { ApiSuccessResponse } from "../types/api.types";

export type AppNotification = {
  id: string;
  type: "expiry_soon" | "expiry_urgent" | "expiry_expired";
  title: string;
  message: string;
  relatedTripId?: string;
  relatedTravelItemId?: string;
  read: boolean;
  createdAt: string;
  metadata?: {
    expiresAt?: string;
    daysUntilExpiry?: number;
  };
};

export type NotificationList = {
  notifications: AppNotification[];
  unreadCount: number;
};

export const notificationsApi = {
  list: (token: string) =>
    apiClient.get<ApiSuccessResponse<NotificationList>>(
      "/api/notifications",
      token,
    ),

  markRead: (id: string, token: string) =>
    apiClient.patch<ApiSuccessResponse<AppNotification>>(
      `/api/notifications/${id}/read`,
      {},
      token,
    ),

  markAllRead: (token: string) =>
    apiClient.post<ApiSuccessResponse<{ updated: number }>>(
      "/api/notifications/read-all",
      {},
      token,
    ),
};
