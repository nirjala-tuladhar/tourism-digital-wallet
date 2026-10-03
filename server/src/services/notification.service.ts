import mongoose from "mongoose";
import {
  getExpirySnapshot,
  selectExpiryReminder,
  startOfUtcDay,
  type ExpiryReminderKind,
} from "../config/expiry.js";
import { AppError } from "../middlewares/AppError.js";
import {
  Notification,
  type NotificationDocument,
  type NotificationType,
} from "../models/Notification.js";
import { ImportantDate } from "../models/ImportantDate.js";
import { TravelItem } from "../models/TravelItem.js";
import { Trip, normalizeTripStatus } from "../models/Trip.js";
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
  tripLabel?: string;
  metadata?: {
    expiresAt?: string;
    daysUntilExpiry?: number;
  };
};

export type NotificationListResponse = {
  notifications: NotificationResponse[];
  unreadCount: number;
};

const REMINDER_TYPE: Record<ExpiryReminderKind, NotificationType> = {
  soon: "expiry_soon",
  urgent: "expiry_urgent",
  day: "expiry_day",
  today: "expiry_today",
  expired: "expiry_expired",
};

const toNotificationResponse = (
  notification: NotificationDocument,
  tripLabel?: string,
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
  tripLabel,
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

const reminderWindow = (daysUntilExpiry: number) => {
  const reminder = selectExpiryReminder(daysUntilExpiry);

  if (!reminder) {
    return null;
  }

  return {
    type: REMINDER_TYPE[reminder.kind],
    dedupeSuffix: reminder.dedupeSuffix,
  };
};

const upsertNotification = async (input: {
  userId: string;
  dedupeKey: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedTripId?: unknown;
  relatedTravelItemId?: unknown;
  metadata?: { expiresAt?: string; daysUntilExpiry?: number };
}): Promise<void> => {
  try {
    await Notification.updateOne(
      { userId: input.userId, dedupeKey: input.dedupeKey },
      {
        $setOnInsert: {
          userId: input.userId,
          type: input.type,
          relatedTripId: input.relatedTripId,
          relatedTravelItemId: input.relatedTravelItemId,
          read: false,
          dedupeKey: input.dedupeKey,
        },
        $set: {
          title: input.title,
          message: input.message,
          metadata: input.metadata,
        },
      },
      { upsert: true },
    );
  } catch (error) {
    if (!isDuplicateKey(error)) {
      throw error;
    }
  }
};

const expiryCopy = (title: string, days: number): { title: string; message: string } => {
  if (days < 0) {
    return { title: `${title} expired`, message: `Your ${title} has expired.` };
  }

  if (days === 0) {
    return { title: `${title} expires today`, message: `Your ${title} expires today.` };
  }

  const dayLabel = days === 1 ? "1 day" : `${days} days`;
  return {
    title: `${title} expiring soon`,
    message: `Your ${title} expires in ${dayLabel}.`,
  };
};

const typeForOffset = (day: number): NotificationType => {
  if (day <= 0) return "expiry_today";
  if (day <= 1) return "expiry_day";
  if (day <= 7) return "expiry_urgent";
  return "expiry_soon";
};

/**
 * Creates missing expiry and trip-lifecycle notifications for the signed-in user.
 * The same event is stored once via dedupeKey, so refreshes do not insert duplicates.
 */
export const syncExpiryNotifications = async (userId: string): Promise<void> => {
  const today = startOfUtcDay(new Date());
  const todayKey = today.toISOString().slice(0, 10);
  const [trips, items, importantDates] = await Promise.all([
    Trip.find({ userId }).select("_id status startDate endDate name origin destination"),
    TravelItem.find({
      userId,
      expiresAt: { $type: "date" },
    }).select("title tripId expiresAt reminderMode reminderDays customReminderDates"),
    ImportantDate.find({ userId }).select("title type date tripId"),
  ]);

  const openTripIds = new Set(
    trips
      .filter((trip) => {
        const status = normalizeTripStatus(String(trip.status));
        return status === "upcoming" || status === "active";
      })
      .map((trip) => String(trip._id)),
  );

  for (const item of items) {
    if (!item.expiresAt || !openTripIds.has(String(item.tripId))) {
      continue;
    }

    const snapshot = getExpirySnapshot(item.expiresAt, today);

    if (snapshot.daysUntilExpiry === null) {
      continue;
    }

    const expiresOn = item.expiresAt.toISOString().slice(0, 10);
    const daysUntil = snapshot.daysUntilExpiry;
    const due: Array<{ suffix: string; type: NotificationType; labelDays: number }> = [];

    if (daysUntil < 0) {
      due.push({ suffix: "expired", type: "expiry_expired", labelDays: daysUntil });
    } else if (item.reminderMode === "custom") {
      for (const day of item.reminderDays ?? []) {
        if (day > 0 && daysUntil <= day) {
          due.push({ suffix: String(day), type: typeForOffset(day), labelDays: day });
        }
      }

      if (daysUntil === 0) {
        due.push({ suffix: "0", type: "expiry_today", labelDays: 0 });
      }

      for (const customDate of item.customReminderDates ?? []) {
        if (startOfUtcDay(customDate).getTime() <= today.getTime()) {
          const stamp = customDate.toISOString().slice(0, 10);
          due.push({
            suffix: `date-${stamp}`,
            type: "expiry_soon",
            labelDays: daysUntil,
          });
        }
      }
    } else {
      const window = reminderWindow(daysUntil);

      if (window) {
        due.push({
          suffix: window.dedupeSuffix,
          type: window.type,
          labelDays: daysUntil,
        });
      }
    }

    for (const reminder of due) {
      const copy = expiryCopy(item.title, reminder.labelDays);
      await upsertNotification({
        userId,
        dedupeKey: `expiry:${reminder.suffix}:${String(item._id)}:${expiresOn}`,
        type: reminder.type,
        title: copy.title,
        message: copy.message,
        relatedTripId: item.tripId,
        relatedTravelItemId: item._id,
        metadata: {
          expiresAt: item.expiresAt.toISOString(),
          daysUntilExpiry: daysUntil,
        },
      });
    }
  }

  for (const trip of trips) {
    const status = normalizeTripStatus(String(trip.status));

    if (status === "cancelled" || status === "completed") {
      continue;
    }

    const start = startOfUtcDay(trip.startDate).toISOString().slice(0, 10);
    const end = startOfUtcDay(trip.endDate).toISOString().slice(0, 10);
    const label = `${trip.origin} → ${trip.destination}`;

    if (status === "upcoming" && todayKey === start) {
      await upsertNotification({
        userId,
        dedupeKey: `trip-start:${String(trip._id)}:${start}`,
        type: "trip_start",
        title: "Trip starts today",
        message: `${trip.name} (${label}) starts today.`,
        relatedTripId: trip._id,
      });
    }

    if (todayKey > end) {
      await upsertNotification({
        userId,
        dedupeKey: `trip-end:${String(trip._id)}:${end}`,
        type: "trip_end",
        title: "Trip has ended",
        message: `${trip.name} (${label}) has ended.`,
        relatedTripId: trip._id,
      });
    }
  }

  const tripsById = new Map(trips.map((trip) => [String(trip._id), trip]));

  for (const entry of importantDates) {
    const trip = tripsById.get(String(entry.tripId));

    if (!trip || normalizeTripStatus(String(trip.status)) === "cancelled") {
      continue;
    }

    const dateKey = startOfUtcDay(entry.date).toISOString().slice(0, 10);

    if (dateKey !== todayKey) {
      continue;
    }

    const label = `${trip.origin} → ${trip.destination}`;

    await upsertNotification({
      userId,
      dedupeKey: `important-date:${String(entry._id)}:${dateKey}`,
      type: "important_date",
      title: `${entry.title} is today`,
      message: `${entry.title} (${entry.type}) is today for ${trip.name} (${label}).`,
      relatedTripId: entry.tripId,
    });
  }
};

const tripLabelsFor = async (userId: string): Promise<Map<string, string>> => {
  const trips = await Trip.find({ userId }).select("origin destination");

  return new Map(
    trips.map((trip) => [
      String(trip._id),
      `${trip.origin} → ${trip.destination}`,
    ]),
  );
};

export const listNotifications = async (
  userId: string,
): Promise<NotificationListResponse> => {
  await syncExpiryNotifications(userId);

  const [notifications, unreadCount, labels] = await Promise.all([
    Notification.find({ userId }).sort({ createdAt: -1 }).limit(30),
    Notification.countDocuments({ userId, read: false }),
    tripLabelsFor(userId),
  ]);

  return {
    notifications: notifications.map((notification) =>
      toNotificationResponse(
        notification,
        notification.relatedTripId
          ? labels.get(String(notification.relatedTripId))
          : undefined,
      ),
    ),
    unreadCount,
  };
};

export const countUnreadNotifications = async (
  userId: string,
): Promise<{ unreadCount: number }> => {
  const unreadCount = await Notification.countDocuments({ userId, read: false });
  return { unreadCount };
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

  const labels = await tripLabelsFor(userId);

  return toNotificationResponse(
    notification,
    notification.relatedTripId
      ? labels.get(String(notification.relatedTripId))
      : undefined,
  );
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

export const deleteNotification = async (
  notificationId: string,
  userId: string,
): Promise<void> => {
  assertValidObjectId(notificationId, "Notification");

  const notification = await Notification.findOneAndDelete({
    _id: notificationId,
    userId,
  });

  if (!notification) {
    throw new AppError("Notification not found", 404);
  }
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
