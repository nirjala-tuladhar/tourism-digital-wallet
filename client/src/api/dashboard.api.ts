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
    completedTrips: number;
    checklistCompleted: number;
    checklistTotal: number;
  };
  expiringSoonDays: number;
  upcomingTrips: Trip[];
  upcomingDates: ImportantDate[];
  upcomingExpirations: UpcomingExpiration[];
  recentItems: TravelItem[];
  importantItems: TravelItem[];
  recentExpenses: Array<{
    id: string;
    tripId: string;
    amount: number;
    currency: string;
    category: string;
    date: string;
    description?: string;
    tripLabel: string;
  }>;
  upcomingItinerary: Array<{
    id: string;
    tripId: string;
    title: string;
    date: string;
    time?: string;
    location?: string;
    tripLabel: string;
  }>;
  openChecklist?: Array<{
    id: string;
    tripId: string;
    title: string;
    tripLabel: string;
  }>;
};

export const dashboardApi = {
  get: (token: string) =>
    apiClient.get<ApiSuccessResponse<DashboardData>>("/api/dashboard", token),
};
