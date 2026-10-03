import { AppError } from "../middlewares/AppError.js";
import {
  ImportantDate,
  type ImportantDateDocument,
} from "../models/ImportantDate.js";
import { Notification } from "../models/Notification.js";
import { TravelItem } from "../models/TravelItem.js";
import { assertValidObjectId } from "../utils/auth.js";
import { getOwnedTripOrThrow } from "./trip.service.js";
import type {
  CreateImportantDateInput,
  UpdateImportantDateInput,
} from "../validators/importantDate.validators.js";

export type ImportantDateResponse = {
  id: string;
  userId: string;
  tripId: string;
  travelItemId?: string;
  title: string;
  date: string;
  type: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
};

const toImportantDateResponse = (
  entry: ImportantDateDocument,
): ImportantDateResponse => ({
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
});

const resolveTravelItemId = async (
  tripId: string,
  userId: string,
  travelItemId: string | null | undefined,
) => {
  if (!travelItemId) {
    return undefined;
  }

  assertValidObjectId(travelItemId, "Travel item");

  const item = await TravelItem.findOne({
    _id: travelItemId,
    tripId,
    userId,
  });

  if (!item) {
    throw new AppError("Travel item not found for this trip", 404);
  }

  return item._id;
};

export const createImportantDate = async (
  tripId: string,
  userId: string,
  input: CreateImportantDateInput,
): Promise<ImportantDateResponse> => {
  const trip = await getOwnedTripOrThrow(tripId, userId);
  const linkedItemId = await resolveTravelItemId(
    tripId,
    userId,
    input.travelItemId,
  );

  const entry = await ImportantDate.create({
    userId,
    tripId: trip._id,
    travelItemId: linkedItemId,
    title: input.title,
    date: new Date(input.date),
    type: input.type,
    description: input.description?.trim()
      ? input.description.trim()
      : undefined,
  });

  return toImportantDateResponse(entry);
};

export const listImportantDates = async (
  tripId: string,
  userId: string,
): Promise<ImportantDateResponse[]> => {
  await getOwnedTripOrThrow(tripId, userId);

  const entries = await ImportantDate.find({ tripId, userId }).sort({
    date: 1,
  });

  return entries.map(toImportantDateResponse);
};

export const getImportantDateById = async (
  tripId: string,
  dateId: string,
  userId: string,
): Promise<ImportantDateResponse> => {
  await getOwnedTripOrThrow(tripId, userId);
  assertValidObjectId(dateId, "Important date");

  const entry = await ImportantDate.findOne({
    _id: dateId,
    tripId,
    userId,
  });

  if (!entry) {
    throw new AppError("Important date not found", 404);
  }

  return toImportantDateResponse(entry);
};

export const updateImportantDate = async (
  tripId: string,
  dateId: string,
  userId: string,
  input: UpdateImportantDateInput,
): Promise<ImportantDateResponse> => {
  await getOwnedTripOrThrow(tripId, userId);
  assertValidObjectId(dateId, "Important date");

  const entry = await ImportantDate.findOne({
    _id: dateId,
    tripId,
    userId,
  });

  if (!entry) {
    throw new AppError("Important date not found", 404);
  }

  if (input.title !== undefined) entry.title = input.title;
  if (input.date !== undefined) entry.date = new Date(input.date);
  if (input.type !== undefined) entry.type = input.type;
  if (input.description !== undefined) {
    entry.description =
      input.description === null || input.description.trim() === ""
        ? undefined
        : input.description.trim();
  }
  if (input.travelItemId !== undefined) {
    entry.travelItemId = await resolveTravelItemId(
      tripId,
      userId,
      input.travelItemId,
    );
  }

  await entry.save();
  return toImportantDateResponse(entry);
};

export const deleteImportantDate = async (
  tripId: string,
  dateId: string,
  userId: string,
): Promise<void> => {
  await getOwnedTripOrThrow(tripId, userId);
  assertValidObjectId(dateId, "Important date");

  const entry = await ImportantDate.findOneAndDelete({
    _id: dateId,
    tripId,
    userId,
  });

  if (!entry) {
    throw new AppError("Important date not found", 404);
  }

  await Notification.deleteMany({
    userId,
    dedupeKey: { $regex: `^important-date:${dateId}:` },
  });
};
