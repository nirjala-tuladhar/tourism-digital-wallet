import { apiClient } from "./client";
import type { ApiSuccessResponse } from "../types/api.types";
import type { TravelItemCategory } from "./travelItems.api";
import type { ExpiryStatus } from "../lib/expiry";

export type SearchTripStatus = "all" | "upcoming" | "active" | "completed" | "cancelled";
export type SearchExpiryFilter = "all" | "none" | "soon" | "expired";

export type SearchFilters = {
  q: string;
  tripStatus: SearchTripStatus;
  category?: TravelItemCategory | "";
  expiry: SearchExpiryFilter;
  dateFrom?: string;
  dateTo?: string;
};

export type SearchResult = {
  kind: "trip" | "travel-item";
  id: string;
  tripId: string;
  travelItemId?: string;
  title: string;
  subtitle?: string;
  category?: string;
  tripName: string;
  tripLabel: string;
  tripStatus: "upcoming" | "active" | "completed" | "cancelled";
  matchedOn: "trip" | "travel-item";
  expiresAt?: string | null;
  expiryStatus: ExpiryStatus;
  daysUntilExpiry: number | null;
};

export type SearchResponse = {
  query: string;
  count: number;
  expiringSoonDays: number;
  results: SearchResult[];
};

const withParams = (filters: SearchFilters): string => {
  const params = new URLSearchParams();

  if (filters.q.trim()) {
    params.set("q", filters.q.trim());
  }

  if (filters.tripStatus !== "all") {
    params.set("tripStatus", filters.tripStatus);
  }

  if (filters.category) {
    params.set("category", filters.category);
  }

  if (filters.expiry !== "all") {
    params.set("expiry", filters.expiry);
  }

  if (filters.dateFrom) {
    params.set("dateFrom", filters.dateFrom);
  }

  if (filters.dateTo) {
    params.set("dateTo", filters.dateTo);
  }

  const query = params.toString();
  return query ? `?${query}` : "";
};

export const searchApi = {
  search: (filters: SearchFilters, token: string) =>
    apiClient.get<ApiSuccessResponse<SearchResponse>>(
      `/api/search${withParams(filters)}`,
      token,
    ),
};
