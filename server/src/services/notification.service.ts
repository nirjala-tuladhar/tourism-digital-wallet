import mongoose from "mongoose";
import {
  EXPIRING_SOON_DAYS,
  EXPIRING_URGENT_DAYS,
  getExpirySnapshot,
} from "../config/expiry.js";
import { AppError } from "../middlewares/AppError.js";
import {
  Notification,
  type NotificationDocument,
  type NotificationType,
} from "../models/Notification.js";
import { TravelItem } from "../models/TravelItem.js";
import { Trip } from "../models/Trip.js";
import { assertValidObjectId } from "../utils/auth.js";

export type NotificationResponse = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedTripId?: string;
  relatedTravelItemId?: string;
  read: boolean;
  createdAt: string;
  metadata?: {
    expiresAt?: string;
    daysUntilExpiry?: number;
  };
};

export type NotificationListResponse = {
  notifications: NotificationResponse[];
  unreadCount: number;
};

const toNotificationResponse = (
  notification: NotificationDocument,
): NotificationResponse => ({
  id: String(notification._id),
  type: notification.type,
  title: notification.title,
  message: notification.message,
  relatedTripId: notification.relatedTripId
    ? String(notification.relatedTripId)
    : undefined,
  relatedTravelItemId: notification.relatedTravelItemId
    ? String(notification.relatedTravelItemId)
    : undefined,
  read: notification.read,
  createdAt: notification.createdAt.toISOString(),
  metadata: notification.metadata
    ? {
        expiresAt: notification.metadata.expiresAt,
        daysUntilExpiry: notification.metadata.daysUntilExpiry,
      }
    : undefined,
});

const isDuplicateKey = (error: unknown): boolean =>
  typeof error === "object" &&
  error !== null &&
  "code" in error &&
  (error as { code?: number }).code === 11000;

const reminderWindow = (
  daysUntilExpiry: number,
): { type: NotificationType; dedupeSuffix: string } | null => {
  if (daysUntilExpiry < 0) {
    return { type: "expiry_expired", dedupeSuffix: "expired" };
  }

  if (daysUntilExpiry <= EXPIRING_URGENT_DAYS) {
    return { type: "expiry_urgent", dedupeSuffix: "7" };
  }

  if (daysUntilExpiry <= EXPIRING_SOON_DAYS) {
    return { type: "expiry_soon", dedupeSuffix: "30" };
  }

  return null;
};

/**
 * Creates missing expiry notifications for the signed-in user.
 * The same trip/item/expiry-date/window is stored once via dedupeKey,
 * so dashboard refreshes do not insert duplicates.
 * A scheduled job can call this later instead of request-time sync.
 */
export const syncExpiryNotifications = async (userId: string): Promise<void> => {
  const [activeTrips, items] = await Promise.all([
    Trip.find({ userId, status: "active" }).select("_id"),
    TravelItem.find({
      userId,
      expiresAt: { $type: "date" },
    }).select("title tripId expiresAt"),
  ]);

  const activeTripIds = new Set(activeTrips.map((trip) => String(trip._id)));

  for (const item of items) {
    if (!item.expiresAt || !activeTripIds.has(String(item.tripId))) {
      continue;
    }

    const snapshot = getExpirySnapshot(item.expiresAt);

    if (snapshot.daysUntilExpiry === null) {
      continue;
    }

    const window = reminderWindow(snapshot.daysUntilExpiry);

    if (!window) {
      continue;
    }

    const expiresOn = item.expiresAt.toISOString().slice(0, 10);
    const dedupeKey = `expiry:${window.dedupeSuffix}:${String(item._id)}:${expiresOn}`;
    const dayLabel =
      snapshot.daysUntilExpiry === 1
        ? "1 day"
        : `${snapshot.daysUntilExpiry} days`;
    const message =
      snapshot.daysUntilExpiry < 0
        ? `Your ${item.title} has expired.`
        : `Your ${item.title} expires in ${dayLabel}.`;
    const title =
      snapshot.daysUntilExpiry < 0
        ? `${item.title} expired`
        : `${item.title} expiring soon`;

    try {
      await Notification.updateOne(
        { userId, dedupeKey },
        {
          $setOnInsert: {
            userId,
            type: window.type,
            relatedTripId: item.tripId,
            relatedTravelItemId: item._id,
            read: false,
            dedupeKey,
          },
          $set: {
            title,
            message,
            metadata: {
              expiresAt: item.expiresAt.toISOString(),
              daysUntilExpiry: snapshot.daysUntilExpiry,
            },
          },
        },
        { upsert: true },
      );
    } catch (error) {
      if (!isDuplicateKey(error)) {
        throw error;
      }
    }
  }
};

export const listNotifications = async (
  userId: string,
): Promise<NotificationListResponse> => {
  await syncExpiryNotifications(userId);

  const [notifications, unreadCount] = await Promise.all([
    Notification.find({ userId }).sort({ createdAt: -1 }).limit(30),
    Notification.countDocuments({ userId, read: false }),
  ]);

  return {
    notifications: notifications.map(toNotificationResponse),
    unreadCount,
  };
};

export const markNotificationRead = async (
  notificationId: string,
  userId: string,
): Promise<NotificationResponse> => {
  assertValidObjectId(notificationId, "Notification");

  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, userId },
    { read: true, readAt: new Date() },
    { new: true },
  );

  if (!notification) {
    throw new AppError("Notification not found", 404);
  }

  return toNotificationResponse(notification);
};

export const markAllNotificationsRead = async (
  userId: string,
): Promise<{ updated: number }> => {
  const result = await Notification.updateMany(
    { userId, read: false },
    { read: true, readAt: new Date() },
  );

  return { updated: result.modifiedCount };
};

export const deleteNotificationsForTrip = async (
  tripId: string,
  userId: string,
): Promise<void> => {
  if (!mongoose.Types.ObjectId.isValid(tripId)) {
    return;
  }

  await Notification.deleteMany({ relatedTripId: tripId, userId });
};

export const deleteNotificationsForTravelItem = async (
  travelItemId: string,
  userId: string,
): Promise<void> => {
  if (!mongoose.Types.ObjectId.isValid(travelItemId)) {
    return;
  }

  await Notification.deleteMany({ relatedTravelItemId: travelItemId, userId });
};
