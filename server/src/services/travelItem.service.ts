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
  createdAt: string;
  updatedAt: string;
};

const toTravelItemResponse = (item: TravelItemDocument): TravelItemResponse => ({
  id: String(item._id),
  userId: String(item.userId),
  tripId: String(item.tripId),
  title: item.title,
  category: item.category,
  description: item.description || undefined,
  labels: item.labels ?? [],
  createdAt: item.createdAt.toISOString(),
  updatedAt: item.updatedAt.toISOString(),
});

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
  });

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

  await item.save();
  return toTravelItemResponse(item);
};

export const deleteTravelItem = async (
  tripId: string,
  itemId: string,
  userId: string,
): Promise<void> => {
  await getOwnedTripOrThrow(tripId, userId);
  assertValidObjectId(itemId, "Travel item");

  const item = await TravelItem.findOneAndDelete({
    _id: itemId,
    tripId,
    userId,
  });

  if (!item) {
    throw new AppError("Travel item not found", 404);
  }
};
