import { apiClient } from "./client";
import type { ApiSuccessResponse } from "../types/api.types";

export type TripStatus = "upcoming" | "active" | "completed" | "cancelled";

export type Trip = {
  id: string;
  userId: string;
  name: string;
  origin: string;
  destination: string;
  startDate: string;
  endDate: string;
  status: TripStatus;
  description?: string;
  budgetAmount?: number | null;
  budgetCurrency?: string | null;
  createdAt: string;
  updatedAt: string;
  travelItemCount?: number;
};

export type CreateTripPayload = {
  name: string;
  origin: string;
  destination: string;
  startDate: string;
  endDate: string;
  description?: string;
  status?: TripStatus;
};

export type UpdateTripPayload = Partial<CreateTripPayload> & {
  budgetAmount?: number | null;
  budgetCurrency?: string | null;
};

export const tripsApi = {
  list: (token: string) =>
    apiClient.get<ApiSuccessResponse<Trip[]>>("/api/trips", token),

  get: (id: string, token: string) =>
    apiClient.get<ApiSuccessResponse<Trip>>(`/api/trips/${id}`, token),

  create: (payload: CreateTripPayload, token: string) =>
    apiClient.post<ApiSuccessResponse<Trip>>("/api/trips", payload, token),

  update: (id: string, payload: UpdateTripPayload, token: string) =>
    apiClient.patch<ApiSuccessResponse<Trip>>(
      `/api/trips/${id}`,
      payload,
      token,
    ),

  remove: (id: string, token: string) =>
    apiClient.delete<ApiSuccessResponse<{ message: string }>>(
      `/api/trips/${id}`,
      token,
    ),
};
