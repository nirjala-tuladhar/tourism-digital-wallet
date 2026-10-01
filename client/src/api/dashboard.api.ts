import { apiClient } from "./client";
import type { ApiSuccessResponse } from "../types/api.types";
import type { Trip } from "./trips.api";
import type { TravelItem } from "./travelItems.api";
import type { ImportantDate } from "./importantDates.api";

export type UpcomingExpiration = {
  travelItemId: string;
  tripId: string;
  title: string;
  category: string;
  tripLabel: string;
  expiresAt: string;
  daysUntilExpiry: number;
};

export type DashboardData = {
  stats: {
    totalTrips: number;
    activeTrips: number;
    upcomingTrips: number;
    travelItems: number;
    documents: number;
    upcomingDates: number;
  };
  expiringSoonDays: number;
  upcomingTrips: Trip[];
  upcomingDates: ImportantDate[];
  upcomingExpirations: UpcomingExpiration[];
  recentItems: TravelItem[];
};

export const dashboardApi = {
  get: (token: string) =>
    apiClient.get<ApiSuccessResponse<DashboardData>>("/api/dashboard", token),
};
