import { EXPIRING_SOON_DAYS } from "../config/expiry.js";
import { normalizeTripStatus } from "../models/Trip.js";
import { Attachment } from "../models/Attachment.js";
import { TRAVEL_ITEM_CATEGORIES, TravelItem } from "../models/TravelItem.js";
import { Trip } from "../models/Trip.js";
import {
  buildSearchResults,
  type SearchExpiryFilter,
  type SearchResult,
  type SearchTripStatus,
} from "./search.logic.js";

export type SearchResponse = {
  query: string;
  count: number;
  expiringSoonDays: number;
  results: SearchResult[];
};

export const searchWallet = async (
  userId: string,
  input: {
    q?: string;
    tripStatus: SearchTripStatus;
    category?: (typeof TRAVEL_ITEM_CATEGORIES)[number];
    expiry: SearchExpiryFilter;
    dateFrom?: string | null;
    dateTo?: string | null;
  },
): Promise<SearchResponse> => {
  const [trips, items, attachments] = await Promise.all([
    Trip.find({ userId }).select(
      "name origin destination description status startDate endDate",
    ),
    TravelItem.find({ userId }).select(
      "title category description labels tripId expiresAt",
    ),
    Attachment.find({ userId }).select("fileName travelItemId"),
  ]);

  const namesByItem = new Map<string, string[]>();

  for (const attachment of attachments) {
    const key = String(attachment.travelItemId);
    const names = namesByItem.get(key) ?? [];
    names.push(attachment.fileName);
    namesByItem.set(key, names);
  }

  const results = buildSearchResults({
    query: input.q ?? "",
    filters: {
      tripStatus: input.tripStatus === "inactive" ? "cancelled" : input.tripStatus,
      category: input.category,
      expiry: input.expiry,
      dateFrom: input.dateFrom,
      dateTo: input.dateTo,
    },
    trips: trips.map((trip) => ({
      id: String(trip._id),
      name: trip.name,
      origin: trip.origin,
      destination: trip.destination,
      description: trip.description || undefined,
      status: normalizeTripStatus(trip.status),
      startDate: trip.startDate.toISOString(),
      endDate: trip.endDate.toISOString(),
    })),
    items: items.map((item) => ({
      id: String(item._id),
      tripId: String(item.tripId),
      title: item.title,
      category: item.category,
      description: item.description || undefined,
      labels: item.labels ?? [],
      expiresAt: item.expiresAt ? item.expiresAt.toISOString() : null,
      attachmentNames: namesByItem.get(String(item._id)) ?? [],
    })),
  });

  return {
    query: input.q?.trim() ?? "",
    count: results.length,
    expiringSoonDays: EXPIRING_SOON_DAYS,
    results,
  };
};
