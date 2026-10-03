import { AppError } from "../middlewares/AppError.js";
import { ChecklistItem } from "../models/ChecklistItem.js";
import { Expense } from "../models/Expense.js";
import { ImportantDate } from "../models/ImportantDate.js";
import { ItineraryItem } from "../models/ItineraryItem.js";
import { TravelItem } from "../models/TravelItem.js";
import { Attachment } from "../models/Attachment.js";
import {
  Trip,
  canTransitionTripStatus,
  normalizeTripStatus,
  type TripDocument,
  type TripStatus,
} from "../models/Trip.js";
import { assertValidObjectId } from "../utils/auth.js";
import { deleteObject } from "./storage.service.js";
import type {
  CreateTripInput,
  UpdateTripInput,
} from "../validators/trip.validators.js";

export type TripResponse = {
  id: string;
  userId: string;
  name: string;
  origin: string;
  destination: string;
  startDate: string;
  endDate: string;
  status: TripStatus;
  description?: string;
  budgetAmount: number | null;
  budgetCurrency: string | null;
  createdAt: string;
  updatedAt: string;
  travelItemCount?: number;
};

export const toTripResponse = (
  trip: TripDocument,
  travelItemCount?: number,
): TripResponse => ({
  id: String(trip._id),
  userId: String(trip.userId),
  name: trip.name,
  origin: trip.origin,
  destination: trip.destination,
  startDate: trip.startDate.toISOString(),
  endDate: trip.endDate.toISOString(),
  status: normalizeTripStatus(trip.status),
  description: trip.description || undefined,
  budgetAmount: trip.budgetAmount ?? null,
  budgetCurrency: trip.budgetCurrency ?? null,
  createdAt: trip.createdAt.toISOString(),
  updatedAt: trip.updatedAt.toISOString(),
  ...(travelItemCount === undefined ? {} : { travelItemCount }),
});

export const getOwnedTripOrThrow = async (
  tripId: string,
  userId: string,
): Promise<TripDocument> => {
  assertValidObjectId(tripId, "Trip");

  const trip = await Trip.findOne({ _id: tripId, userId });

  if (!trip) {
    throw new AppError("Trip not found", 404);
  }

  return trip;
};

export const createTrip = async (
  userId: string,
  input: CreateTripInput,
): Promise<TripResponse> => {
  const trip = await Trip.create({
    userId,
    name: input.name,
    origin: input.origin,
    destination: input.destination,
    startDate: new Date(input.startDate),
    endDate: new Date(input.endDate),
    status: input.status ?? "upcoming",
    description: input.description?.trim() ? input.description.trim() : undefined,
  });

  return toTripResponse(trip, 0);
};

export const listTrips = async (userId: string): Promise<TripResponse[]> => {
  const trips = await Trip.find({ userId }).sort({ startDate: 1 });

  if (trips.length === 0) {
    return [];
  }

  const itemCounts = await TravelItem.aggregate<{
    _id: { toString(): string };
    count: number;
  }>([
    { $match: { userId: trips[0].userId } },
    { $group: { _id: "$tripId", count: { $sum: 1 } } },
  ]);

  const countMap = new Map(
    itemCounts.map((row) => [String(row._id), row.count] as const),
  );

  return trips.map((trip) =>
    toTripResponse(trip, countMap.get(String(trip._id)) ?? 0),
  );
};

export const getTripById = async (
  tripId: string,
  userId: string,
): Promise<TripResponse> => {
  const trip = await getOwnedTripOrThrow(tripId, userId);
  const travelItemCount = await TravelItem.countDocuments({
    tripId: trip._id,
    userId,
  });

  return toTripResponse(trip, travelItemCount);
};

export const updateTrip = async (
  tripId: string,
  userId: string,
  input: UpdateTripInput,
): Promise<TripResponse> => {
  const trip = await getOwnedTripOrThrow(tripId, userId);

  if (input.name !== undefined) trip.name = input.name;
  if (input.origin !== undefined) trip.origin = input.origin;
  if (input.destination !== undefined) trip.destination = input.destination;
  if (input.startDate !== undefined) trip.startDate = new Date(input.startDate);
  if (input.endDate !== undefined) trip.endDate = new Date(input.endDate);
  if (input.status !== undefined) {
    const current = normalizeTripStatus(trip.status);

    if (!canTransitionTripStatus(current, input.status)) {
      throw new AppError(
        `A ${current} trip cannot be marked ${input.status}.`,
        400,
      );
    }

    trip.status = input.status;
  }
  if (input.description !== undefined) {
    trip.description =
      input.description === null || input.description.trim() === ""
        ? undefined
        : input.description.trim();
  }
  if (input.budgetAmount !== undefined) {
    trip.budgetAmount = input.budgetAmount;
  }
  if (input.budgetCurrency !== undefined) {
    trip.budgetCurrency = input.budgetCurrency ? input.budgetCurrency.toUpperCase() : null;
  }
  if (trip.budgetAmount == null) {
    trip.budgetCurrency = null;
  } else if (!trip.budgetCurrency) {
    throw new AppError("Budget currency is required", 400);
  }

  if (trip.endDate < trip.startDate) {
    throw new AppError("End date must not be before start date", 400);
  }

  await trip.save();

  const travelItemCount = await TravelItem.countDocuments({
    tripId: trip._id,
    userId,
  });

  return toTripResponse(trip, travelItemCount);
};

export const deleteTrip = async (
  tripId: string,
  userId: string,
): Promise<void> => {
  const trip = await getOwnedTripOrThrow(tripId, userId);

  const attachments = await Attachment.find({ tripId: trip._id, userId });

  for (const attachment of attachments) {
    try {
      await deleteObject(attachment.storageKey);
    } catch {
      // Continue cleanup for remaining objects/metadata.
    }
  }

  const { deleteNotificationsForTrip } = await import(
    "./notification.service.js"
  );

  await Promise.all([
    Attachment.deleteMany({ tripId: trip._id, userId }),
    TravelItem.deleteMany({ tripId: trip._id, userId }),
    ImportantDate.deleteMany({ tripId: trip._id, userId }),
    ItineraryItem.deleteMany({ tripId: trip._id, userId }),
    ChecklistItem.deleteMany({ tripId: trip._id, userId }),
    Expense.deleteMany({ tripId: trip._id, userId }),
    deleteNotificationsForTrip(String(trip._id), userId),
    trip.deleteOne(),
  ]);
};
