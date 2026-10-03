import { parseDateOnly } from "../config/expiry.js";
import { AppError } from "../middlewares/AppError.js";
import { ItineraryItem, type ItineraryItemDocument } from "../models/ItineraryItem.js";
import { TravelItem } from "../models/TravelItem.js";
import { assertValidObjectId } from "../utils/auth.js";
import { getOwnedTripOrThrow } from "./trip.service.js";
import mongoose from "mongoose";
import type {
  CreateItineraryInput,
  UpdateItineraryInput,
} from "../validators/itinerary.validators.js";

export type ItineraryResponse = {
  id: string;
  userId: string;
  tripId: string;
  travelItemId?: string;
  date: string;
  time?: string;
  title: string;
  location?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
};

const toResponse = (item: ItineraryItemDocument): ItineraryResponse => ({
  id: String(item._id),
  userId: String(item.userId),
  tripId: String(item.tripId),
  travelItemId: item.travelItemId ? String(item.travelItemId) : undefined,
  date: item.date.toISOString(),
  time: item.time || undefined,
  title: item.title,
  location: item.location || undefined,
  description: item.description || undefined,
  createdAt: item.createdAt.toISOString(),
  updatedAt: item.updatedAt.toISOString(),
});

const assertOwnedTravelItem = async (
  tripId: string,
  userId: string,
  travelItemId: string | null | undefined,
): Promise<void> => {
  if (!travelItemId) {
    return;
  }

  assertValidObjectId(travelItemId, "Travel item");
  const item = await TravelItem.findOne({ _id: travelItemId, tripId, userId }).select("_id");

  if (!item) {
    throw new AppError("Travel item not found", 404);
  }
};

const cleanTime = (time: string | null | undefined): string | undefined => {
  const value = time?.trim();
  return value ? value : undefined;
};

export const listItinerary = async (
  tripId: string,
  userId: string,
): Promise<ItineraryResponse[]> => {
  await getOwnedTripOrThrow(tripId, userId);
  const items = await ItineraryItem.find({ tripId, userId }).sort({ date: 1, time: 1, createdAt: 1 });
  return items.map(toResponse);
};

export const createItineraryItem = async (
  tripId: string,
  userId: string,
  input: CreateItineraryInput,
): Promise<ItineraryResponse> => {
  const trip = await getOwnedTripOrThrow(tripId, userId);
  const travelItemId = input.travelItemId?.trim() ? input.travelItemId.trim() : undefined;
  await assertOwnedTravelItem(String(trip._id), userId, travelItemId);

  const item = await ItineraryItem.create({
    userId,
    tripId: trip._id,
    travelItemId: travelItemId ?? null,
    date: parseDateOnly(input.date),
    time: cleanTime(input.time),
    title: input.title,
    location: input.location?.trim() || undefined,
    description: input.description?.trim() || undefined,
  });

  return toResponse(item);
};

export const updateItineraryItem = async (
  tripId: string,
  itemId: string,
  userId: string,
  input: UpdateItineraryInput,
): Promise<ItineraryResponse> => {
  await getOwnedTripOrThrow(tripId, userId);
  assertValidObjectId(itemId, "Itinerary item");

  const item = await ItineraryItem.findOne({ _id: itemId, tripId, userId });

  if (!item) {
    throw new AppError("Itinerary item not found", 404);
  }

  if (input.travelItemId !== undefined) {
    const travelItemId = input.travelItemId?.trim() ? input.travelItemId.trim() : undefined;
    await assertOwnedTravelItem(tripId, userId, travelItemId);
    item.travelItemId = travelItemId
      ? new mongoose.Types.ObjectId(travelItemId)
      : null;
  }

  if (input.date !== undefined) item.date = parseDateOnly(input.date);
  if (input.time !== undefined) item.time = cleanTime(input.time ?? undefined);
  if (input.title !== undefined) item.title = input.title;
  if (input.location !== undefined) item.location = input.location?.trim() || undefined;
  if (input.description !== undefined) item.description = input.description?.trim() || undefined;

  await item.save();
  return toResponse(item);
};

export const deleteItineraryItem = async (
  tripId: string,
  itemId: string,
  userId: string,
): Promise<void> => {
  await getOwnedTripOrThrow(tripId, userId);
  assertValidObjectId(itemId, "Itinerary item");
  const item = await ItineraryItem.findOne({ _id: itemId, tripId, userId });

  if (!item) {
    throw new AppError("Itinerary item not found", 404);
  }

  await item.deleteOne();
};
