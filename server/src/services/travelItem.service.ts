import { getExpirySnapshot, parseDateOnly } from "../config/expiry.js";
import { AppError } from "../middlewares/AppError.js";
import { TravelItem, type TravelItemDocument } from "../models/TravelItem.js";
import { assertValidObjectId } from "../utils/auth.js";
import { getOwnedTripOrThrow } from "./trip.service.js";
import type {
  CreateTravelItemInput,
  UpdateTravelItemInput,
} from "../validators/travelItem.validators.js";

export type TravelItemResponse = {
  id: string;
  userId: string;
  tripId: string;
  title: string;
  category: string;
  description?: string;
  labels: string[];
  expiresAt: string | null;
  expiryStatus: "none" | "active" | "expiring_soon" | "expired";
  daysUntilExpiry: number | null;
  important: boolean;
  reminderMode: "default" | "custom";
  reminderDays: number[];
  customReminderDates: string[];
  createdAt: string;
  updatedAt: string;
};

const expiryFields = (expiresAt?: Date | null) => {
  const snapshot = getExpirySnapshot(expiresAt ?? null);

  return {
    expiresAt: expiresAt ? expiresAt.toISOString() : null,
    expiryStatus: snapshot.expiryStatus,
    daysUntilExpiry: snapshot.daysUntilExpiry,
  };
};

export const toTravelItemResponse = (
  item: TravelItemDocument,
): TravelItemResponse => ({
  id: String(item._id),
  userId: String(item.userId),
  tripId: String(item.tripId),
  title: item.title,
  category: item.category,
  description: item.description || undefined,
  labels: item.labels ?? [],
  ...expiryFields(item.expiresAt),
  important: Boolean(item.important),
  reminderMode: item.reminderMode === "custom" ? "custom" : "default",
  reminderDays: item.reminderDays ?? [],
  customReminderDates: (item.customReminderDates ?? []).map((date) => date.toISOString()),
  createdAt: item.createdAt.toISOString(),
  updatedAt: item.updatedAt.toISOString(),
});

const assignReminders = (
  item: TravelItemDocument,
  input: {
    reminderMode?: "default" | "custom";
    reminderDays?: number[];
    customReminderDates?: string[];
    important?: boolean;
  },
): void => {
  if (input.important !== undefined) {
    item.important = input.important;
  }

  if (input.reminderMode !== undefined) {
    item.reminderMode = input.reminderMode;
  }

  if (input.reminderDays !== undefined) {
    item.reminderDays = input.reminderDays;
  }

  if (input.customReminderDates !== undefined) {
    item.customReminderDates = input.customReminderDates.map((value) => parseDateOnly(value));
  }

  if (item.reminderMode !== "custom") {
    item.reminderDays = [];
    item.customReminderDates = [];
  }
};

const assignExpiry = (
  item: TravelItemDocument,
  expiresAt: string | null | undefined,
): void => {
  if (expiresAt === undefined) {
    return;
  }

  item.expiresAt = expiresAt ? parseDateOnly(expiresAt) : null;
};

export const createTravelItem = async (
  tripId: string,
  userId: string,
  input: CreateTravelItemInput,
): Promise<TravelItemResponse> => {
  const trip = await getOwnedTripOrThrow(tripId, userId);

  const item = await TravelItem.create({
    userId,
    tripId: trip._id,
    title: input.title,
    category: input.category,
    description: input.description?.trim()
      ? input.description.trim()
      : undefined,
    labels: input.labels ?? [],
    expiresAt: input.expiresAt ? parseDateOnly(input.expiresAt) : null,
    important: input.important ?? false,
    reminderMode: input.reminderMode ?? "default",
    reminderDays: input.reminderMode === "custom" ? (input.reminderDays ?? []) : [],
    customReminderDates:
      input.reminderMode === "custom"
        ? (input.customReminderDates ?? []).map((value) => parseDateOnly(value))
        : [],
  });

  const { syncExpiryNotifications } = await import("./notification.service.js");
  await syncExpiryNotifications(userId);

  return toTravelItemResponse(item);
};

export const listTravelItems = async (
  tripId: string,
  userId: string,
): Promise<TravelItemResponse[]> => {
  await getOwnedTripOrThrow(tripId, userId);

  const items = await TravelItem.find({ tripId, userId }).sort({
    createdAt: -1,
  });

  return items.map(toTravelItemResponse);
};

export const getTravelItemById = async (
  tripId: string,
  itemId: string,
  userId: string,
): Promise<TravelItemResponse> => {
  await getOwnedTripOrThrow(tripId, userId);
  assertValidObjectId(itemId, "Travel item");

  const item = await TravelItem.findOne({ _id: itemId, tripId, userId });

  if (!item) {
    throw new AppError("Travel item not found", 404);
  }

  return toTravelItemResponse(item);
};

export const updateTravelItem = async (
  tripId: string,
  itemId: string,
  userId: string,
  input: UpdateTravelItemInput,
): Promise<TravelItemResponse> => {
  await getOwnedTripOrThrow(tripId, userId);
  assertValidObjectId(itemId, "Travel item");

  const item = await TravelItem.findOne({ _id: itemId, tripId, userId });

  if (!item) {
    throw new AppError("Travel item not found", 404);
  }

  if (input.title !== undefined) item.title = input.title;
  if (input.category !== undefined) item.category = input.category;
  if (input.labels !== undefined) item.labels = input.labels;
  if (input.description !== undefined) {
    item.description =
      input.description === null || input.description.trim() === ""
        ? undefined
        : input.description.trim();
  }
  assignExpiry(item, input.expiresAt);
  assignReminders(item, input);

  await item.save();

  const { syncExpiryNotifications } = await import("./notification.service.js");
  await syncExpiryNotifications(userId);

  return toTravelItemResponse(item);
};

export const deleteTravelItem = async (
  tripId: string,
  itemId: string,
  userId: string,
): Promise<void> => {
  await getOwnedTripOrThrow(tripId, userId);
  assertValidObjectId(itemId, "Travel item");

  const item = await TravelItem.findOne({
    _id: itemId,
    tripId,
    userId,
  });

  if (!item) {
    throw new AppError("Travel item not found", 404);
  }

  const { deleteAttachmentsForTravelItem } = await import(
    "./attachment.service.js"
  );
  const { deleteNotificationsForTravelItem } = await import(
    "./notification.service.js"
  );
  await deleteAttachmentsForTravelItem(String(item._id), userId);
  await deleteNotificationsForTravelItem(String(item._id), userId);
  await item.deleteOne();
};
