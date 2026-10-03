import { apiClient } from "./client";
import type { ApiSuccessResponse } from "../types/api.types";

export type AppNotification = {
  id: string;
  type:
    | "expiry_soon"
    | "expiry_urgent"
    | "expiry_day"
    | "expiry_today"
    | "expiry_expired"
    | "trip_start"
    | "trip_end"
    | "important_date";
  title: string;
  message: string;
  relatedTripId?: string;
  relatedTravelItemId?: string;
  tripLabel?: string;
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
    apiClient.patch<ApiSuccessResponse<{ updated: number }>>(
      "/api/notifications/read-all",
      {},
      token,
    ),

  remove: (id: string, token: string) =>
    apiClient.delete<ApiSuccessResponse<{ message: string }>>(
      `/api/notifications/${id}`,
      token,
    ),
};
