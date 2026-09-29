import { apiClient } from "./client";
import type { ApiSuccessResponse } from "../types/api.types";
import type { Trip } from "./trips.api";
import type { TravelItem } from "./travelItems.api";
import type { ImportantDate } from "./importantDates.api";

export type DashboardData = {
  stats: {
    activeTrips: number;
    upcomingTrips: number;
    travelItems: number;
  };
  upcomingTrips: Trip[];
  upcomingDates: ImportantDate[];
  recentItems: TravelItem[];
};

export const dashboardApi = {
  get: (token: string) =>
    apiClient.get<ApiSuccessResponse<DashboardData>>("/api/dashboard", token),
};
