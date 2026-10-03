import { EXPIRING_SOON_DAYS, getExpirySnapshot } from "../config/expiry.js";
import mongoose from "mongoose";
import { Attachment } from "../models/Attachment.js";
import { ChecklistItem } from "../models/ChecklistItem.js";
import { Expense } from "../models/Expense.js";
import { ImportantDate } from "../models/ImportantDate.js";
import { ItineraryItem } from "../models/ItineraryItem.js";
import { TravelItem } from "../models/TravelItem.js";
import { Trip } from "../models/Trip.js";
import { syncExpiryNotifications } from "./notification.service.js";
import { toTripResponse, type TripResponse } from "./trip.service.js";
import type { ImportantDateResponse } from "./importantDate.service.js";
import {
  toTravelItemResponse,
  type TravelItemResponse,
} from "./travelItem.service.js";

export type UpcomingExpiration = {
  travelItemId: string;
  tripId: string;
  title: string;
  category: string;
  tripLabel: string;
  expiresAt: string;
  daysUntilExpiry: number;
};

export type DashboardResponse = {
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
  upcomingTrips: TripResponse[];
  upcomingDates: ImportantDateResponse[];
  upcomingExpirations: UpcomingExpiration[];
  recentItems: TravelItemResponse[];
  importantItems: TravelItemResponse[];
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
  openChecklist: Array<{
    id: string;
    tripId: string;
    title: string;
    tripLabel: string;
  }>;
};

const startOfToday = (): Date => {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
};

export const getDashboard = async (
  userId: string,
): Promise<DashboardResponse> => {
  const today = startOfToday();

  await syncExpiryNotifications(userId);

  const [totalTrips, activeTrips, upcomingTripsCount, completedTrips, upcomingTripDocs, travelItems, documents, upcomingDatesCount, upcomingDateDocs, recentItemDocs, importantItemDocs, expiringItemDocs, openTripDocs, checklistRows, openChecklistDocs, recentExpenseDocs, upcomingItineraryDocs] =
    await Promise.all([
      Trip.countDocuments({ userId }),
      Trip.countDocuments({ userId, status: "active" }),
      Trip.countDocuments({ userId, status: "upcoming" }),
      Trip.countDocuments({ userId, status: "completed" }),
      Trip.find({ userId, status: "upcoming" }).sort({ startDate: 1 }).limit(5),
      TravelItem.countDocuments({ userId }),
      Attachment.countDocuments({ userId }),
      ImportantDate.countDocuments({ userId, date: { $gte: today } }),
      ImportantDate.find({ userId, date: { $gte: today } }).sort({ date: 1 }).limit(5),
      TravelItem.find({ userId }).sort({ updatedAt: -1 }).limit(5),
      TravelItem.find({ userId, important: true }).sort({ updatedAt: -1 }).limit(4),
      TravelItem.find({ userId, expiresAt: { $type: "date" } }).select("title category tripId expiresAt"),
      Trip.find({ userId }).select("origin destination status"),
      ChecklistItem.aggregate<{ _id: boolean; count: number }>([
        { $match: { userId: new mongoose.Types.ObjectId(userId) } },
        { $group: { _id: "$completed", count: { $sum: 1 } } },
      ]),
      ChecklistItem.find({ userId, completed: false }).sort({ position: 1, updatedAt: -1 }).limit(6),
      Expense.find({ userId }).sort({ date: -1, createdAt: -1 }).limit(4),
      ItineraryItem.find({ userId, date: { $gte: today } }).sort({ date: 1, time: 1 }).limit(4),
    ]);

  const tripLabels = new Map(
    openTripDocs
      .filter((trip) => trip.status === "upcoming" || trip.status === "active")
      .map((trip) => [String(trip._id), `${trip.origin} → ${trip.destination}`] as const),
  );
  const allTripLabels = new Map(
    openTripDocs.map((trip) => [String(trip._id), `${trip.origin} → ${trip.destination}`] as const),
  );

  const upcomingExpirations = expiringItemDocs
    .flatMap((item) => {
      if (!item.expiresAt) {
        return [];
      }

      const tripLabel = tripLabels.get(String(item.tripId));

      if (!tripLabel) {
        return [];
      }

      const snapshot = getExpirySnapshot(item.expiresAt, today);

      if (
        snapshot.expiryStatus !== "expiring_soon" ||
        snapshot.daysUntilExpiry === null
      ) {
        return [];
      }

      return [
        {
          travelItemId: String(item._id),
          tripId: String(item.tripId),
          title: item.title,
          category: item.category,
          tripLabel,
          expiresAt: item.expiresAt.toISOString(),
          daysUntilExpiry: snapshot.daysUntilExpiry,
        },
      ];
    })
    .sort((left, right) => left.daysUntilExpiry - right.daysUntilExpiry)
    .slice(0, 4);

  return {
    stats: {
      totalTrips,
      activeTrips,
      upcomingTrips: upcomingTripsCount,
      travelItems,
      documents,
      upcomingDates: upcomingDatesCount,
      completedTrips,
      checklistCompleted: checklistRows.find((row) => row._id === true)?.count ?? 0,
      checklistTotal: checklistRows.reduce((sum, row) => sum + row.count, 0),
    },
    expiringSoonDays: EXPIRING_SOON_DAYS,
    upcomingTrips: upcomingTripDocs.map((trip) => toTripResponse(trip)),
    upcomingExpirations,
    upcomingDates: upcomingDateDocs.map((entry) => ({
      id: String(entry._id),
      userId: String(entry.userId),
      tripId: String(entry.tripId),
      travelItemId: entry.travelItemId
        ? String(entry.travelItemId)
        : undefined,
      title: entry.title,
      date: entry.date.toISOString(),
      type: entry.type,
      description: entry.description || undefined,
      createdAt: entry.createdAt.toISOString(),
      updatedAt: entry.updatedAt.toISOString(),
    })),
    recentItems: recentItemDocs.map((item) => toTravelItemResponse(item)),
    importantItems: importantItemDocs.map((item) => toTravelItemResponse(item)),
    recentExpenses: recentExpenseDocs.map((expense) => ({
      id: String(expense._id),
      tripId: String(expense.tripId),
      amount: expense.amount,
      currency: expense.currency,
      category: expense.category,
      date: expense.date.toISOString(),
      description: expense.description || undefined,
      tripLabel: allTripLabels.get(String(expense.tripId)) ?? "Trip",
    })),
    upcomingItinerary: upcomingItineraryDocs.map((entry) => ({
      id: String(entry._id),
      tripId: String(entry.tripId),
      title: entry.title,
      date: entry.date.toISOString(),
      time: entry.time || undefined,
      location: entry.location || undefined,
      tripLabel: allTripLabels.get(String(entry.tripId)) ?? "Trip",
    })),
    openChecklist: openChecklistDocs.map((item) => ({
      id: String(item._id),
      tripId: String(item.tripId),
      title: item.title,
      tripLabel: allTripLabels.get(String(item.tripId)) ?? "Trip",
    })),
  };
};
