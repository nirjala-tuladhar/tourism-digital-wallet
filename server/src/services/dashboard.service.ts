import { ImportantDate } from "../models/ImportantDate.js";
import { TravelItem } from "../models/TravelItem.js";
import { Trip } from "../models/Trip.js";
import { toTripResponse, type TripResponse } from "./trip.service.js";
import type { ImportantDateResponse } from "./importantDate.service.js";
import type { TravelItemResponse } from "./travelItem.service.js";

export type DashboardResponse = {
  stats: {
    activeTrips: number;
    upcomingTrips: number;
    travelItems: number;
  };
  upcomingTrips: TripResponse[];
  upcomingDates: ImportantDateResponse[];
  recentItems: TravelItemResponse[];
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

  const [activeTrips, upcomingTripDocs, travelItems, upcomingDateDocs, recentItemDocs] =
    await Promise.all([
      Trip.countDocuments({ userId, status: "active" }),
      Trip.find({
        userId,
        status: "active",
        endDate: { $gte: today },
      })
        .sort({ startDate: 1 })
        .limit(5),
      TravelItem.countDocuments({ userId }),
      ImportantDate.find({
        userId,
        date: { $gte: today },
      })
        .sort({ date: 1 })
        .limit(5),
      TravelItem.find({ userId }).sort({ updatedAt: -1 }).limit(5),
    ]);

  const upcomingTripsCount = await Trip.countDocuments({
    userId,
    status: "active",
    startDate: { $gte: today },
  });

  return {
    stats: {
      activeTrips,
      upcomingTrips: upcomingTripsCount,
      travelItems,
    },
    upcomingTrips: upcomingTripDocs.map((trip) => toTripResponse(trip)),
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
    recentItems: recentItemDocs.map((item) => ({
      id: String(item._id),
      userId: String(item.userId),
      tripId: String(item.tripId),
      title: item.title,
      category: item.category,
      description: item.description || undefined,
      labels: item.labels ?? [],
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    })),
  };
};
