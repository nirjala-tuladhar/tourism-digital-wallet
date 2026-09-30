import { apiClient } from "./client";
import type { ExpiryStatus } from "../lib/expiry";
import type { ApiSuccessResponse } from "../types/api.types";

export const TRAVEL_ITEM_CATEGORIES = [
  "Flight",
  "Hotel",
  "Visa",
  "Insurance",
  "Transportation",
  "Activity",
  "Document",
  "Other",
] as const;

export type TravelItemCategory = (typeof TRAVEL_ITEM_CATEGORIES)[number];

export type TravelItem = {
  id: string;
  userId: string;
  tripId: string;
  title: string;
  category: TravelItemCategory | string;
  description?: string;
  labels: string[];
  expiresAt?: string | null;
  expiryStatus?: ExpiryStatus;
  daysUntilExpiry?: number | null;
  createdAt: string;
  updatedAt: string;
};

export type TravelItemPayload = {
  title: string;
  category: TravelItemCategory;
  description?: string;
  labels?: string[];
  expiresAt?: string | null;
};

export const travelItemsApi = {
  list: (tripId: string, token: string) =>
    apiClient.get<ApiSuccessResponse<TravelItem[]>>(
      `/api/trips/${tripId}/items`,
      token,
    ),

  create: (tripId: string, payload: TravelItemPayload, token: string) =>
    apiClient.post<ApiSuccessResponse<TravelItem>>(
      `/api/trips/${tripId}/items`,
      payload,
      token,
    ),

  update: (
    tripId: string,
    itemId: string,
    payload: Partial<TravelItemPayload>,
    token: string,
  ) =>
    apiClient.patch<ApiSuccessResponse<TravelItem>>(
      `/api/trips/${tripId}/items/${itemId}`,
      payload,
      token,
    ),

  remove: (tripId: string, itemId: string, token: string) =>
    apiClient.delete<ApiSuccessResponse<{ message: string }>>(
      `/api/trips/${tripId}/items/${itemId}`,
      token,
    ),
};
