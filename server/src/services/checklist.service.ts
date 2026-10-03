import { AppError } from "../middlewares/AppError.js";
import { ChecklistItem, type ChecklistItemDocument } from "../models/ChecklistItem.js";
import { assertValidObjectId } from "../utils/auth.js";
import { getOwnedTripOrThrow } from "./trip.service.js";
import type {
  CreateChecklistInput,
  ReorderChecklistInput,
  UpdateChecklistInput,
} from "../validators/checklist.validators.js";

export type ChecklistResponse = {
  id: string;
  userId: string;
  tripId: string;
  title: string;
  completed: boolean;
  position: number;
  createdAt: string;
  updatedAt: string;
};

const toResponse = (item: ChecklistItemDocument): ChecklistResponse => ({
  id: String(item._id),
  userId: String(item.userId),
  tripId: String(item.tripId),
  title: item.title,
  completed: item.completed,
  position: item.position,
  createdAt: item.createdAt.toISOString(),
  updatedAt: item.updatedAt.toISOString(),
});

export const listChecklist = async (
  tripId: string,
  userId: string,
): Promise<ChecklistResponse[]> => {
  await getOwnedTripOrThrow(tripId, userId);
  const items = await ChecklistItem.find({ tripId, userId }).sort({ position: 1, createdAt: 1 });
  return items.map(toResponse);
};

export const createChecklistItem = async (
  tripId: string,
  userId: string,
  input: CreateChecklistInput,
): Promise<ChecklistResponse> => {
  const trip = await getOwnedTripOrThrow(tripId, userId);
  const last = await ChecklistItem.findOne({ tripId, userId }).sort({ position: -1 }).select("position");

  const item = await ChecklistItem.create({
    userId,
    tripId: trip._id,
    title: input.title,
    completed: false,
    position: (last?.position ?? -1) + 1,
  });

  return toResponse(item);
};

export const updateChecklistItem = async (
  tripId: string,
  itemId: string,
  userId: string,
  input: UpdateChecklistInput,
): Promise<ChecklistResponse> => {
  await getOwnedTripOrThrow(tripId, userId);
  assertValidObjectId(itemId, "Checklist item");
  const item = await ChecklistItem.findOne({ _id: itemId, tripId, userId });

  if (!item) {
    throw new AppError("Checklist item not found", 404);
  }

  if (input.title !== undefined) item.title = input.title;
  if (input.completed !== undefined) item.completed = input.completed;
  await item.save();
  return toResponse(item);
};

export const deleteChecklistItem = async (
  tripId: string,
  itemId: string,
  userId: string,
): Promise<void> => {
  await getOwnedTripOrThrow(tripId, userId);
  assertValidObjectId(itemId, "Checklist item");
  const item = await ChecklistItem.findOne({ _id: itemId, tripId, userId });

  if (!item) {
    throw new AppError("Checklist item not found", 404);
  }

  await item.deleteOne();
};

export const reorderChecklist = async (
  tripId: string,
  userId: string,
  input: ReorderChecklistInput,
): Promise<ChecklistResponse[]> => {
  await getOwnedTripOrThrow(tripId, userId);
  const items = await ChecklistItem.find({ tripId, userId });
  const ids = new Set(items.map((item) => String(item._id)));

  if (
    input.orderedIds.length !== items.length ||
    input.orderedIds.some((id) => !ids.has(id))
  ) {
    throw new AppError("Checklist order does not match this trip", 400);
  }

  await Promise.all(
    input.orderedIds.map((id, position) =>
      ChecklistItem.updateOne({ _id: id, tripId, userId }, { $set: { position } }),
    ),
  );

  return listChecklist(tripId, userId);
};
