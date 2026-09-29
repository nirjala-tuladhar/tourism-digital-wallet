import { apiClient } from "./client";
import type { ApiSuccessResponse } from "../types/api.types";

export const IMPORTANT_DATE_TYPES = [
  "Flight departure",
  "Hotel check-in",
  "Hotel check-out",
  "Visa expiry",
  "Insurance expiry",
  "Activity date",
  "Other",
] as const;

export type ImportantDateType = (typeof IMPORTANT_DATE_TYPES)[number];

export type ImportantDate = {
  id: string;
  userId: string;
  tripId: string;
  travelItemId?: string;
  title: string;
  date: string;
  type: ImportantDateType | string;
  description?: string;
  createdAt: string;
  updatedAt: string;
};

export type ImportantDatePayload = {
  title: string;
  date: string;
  type: ImportantDateType;
  description?: string;
  travelItemId?: string | null;
};

export const importantDatesApi = {
  list: (tripId: string, token: string) =>
    apiClient.get<ApiSuccessResponse<ImportantDate[]>>(
      `/api/trips/${tripId}/dates`,
      token,
    ),

  create: (tripId: string, payload: ImportantDatePayload, token: string) =>
    apiClient.post<ApiSuccessResponse<ImportantDate>>(
      `/api/trips/${tripId}/dates`,
      payload,
      token,
    ),

  update: (
    tripId: string,
    dateId: string,
    payload: Partial<ImportantDatePayload>,
    token: string,
  ) =>
    apiClient.patch<ApiSuccessResponse<ImportantDate>>(
      `/api/trips/${tripId}/dates/${dateId}`,
      payload,
      token,
    ),

  remove: (tripId: string, dateId: string, token: string) =>
    apiClient.delete<ApiSuccessResponse<{ message: string }>>(
      `/api/trips/${tripId}/dates/${dateId}`,
      token,
    ),
};
