import { EXPIRING_SOON_DAYS, getExpirySnapshot } from "../config/expiry.js";
import { ImportantDate } from "../models/ImportantDate.js";
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
    activeTrips: number;
    upcomingTrips: number;
    travelItems: number;
  };
  expiringSoonDays: number;
  upcomingTrips: TripResponse[];
  upcomingDates: ImportantDateResponse[];
  upcomingExpirations: UpcomingExpiration[];
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

  await syncExpiryNotifications(userId);

  const [activeTrips, upcomingTripDocs, travelItems, upcomingDateDocs, recentItemDocs, expiringItemDocs, activeTripDocs] =
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
      TravelItem.find({
        userId,
        expiresAt: { $type: "date" },
      }).select("title category tripId expiresAt"),
      Trip.find({ userId, status: "active" }).select("origin destination"),
    ]);

  const upcomingTripsCount = await Trip.countDocuments({
    userId,
    status: "active",
    startDate: { $gte: today },
  });

  const activeTripLabels = new Map(
    activeTripDocs.map((trip) => [
      String(trip._id),
      `${trip.origin} → ${trip.destination}`,
    ]),
  );

  const upcomingExpirations = expiringItemDocs
    .flatMap((item) => {
      if (!item.expiresAt) {
        return [];
      }

      const tripLabel = activeTripLabels.get(String(item.tripId));

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
      activeTrips,
      upcomingTrips: upcomingTripsCount,
      travelItems,
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
  };
};
