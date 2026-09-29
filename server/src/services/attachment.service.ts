import { randomUUID } from "node:crypto";
import path from "node:path";
import { AppError } from "../middlewares/AppError.js";
import { Attachment, type AttachmentDocument } from "../models/Attachment.js";
import {
  MIME_EXTENSION_MAP,
  type AllowedMimeType,
  getMaxFileSizeBytes,
} from "../config/storage.js";
import { assertValidObjectId } from "../utils/auth.js";
import { getOwnedTripOrThrow } from "./trip.service.js";
import { TravelItem } from "../models/TravelItem.js";
import {
  createPresignedDownloadUrl,
  createPresignedUploadUrl,
  deleteObject,
  objectExists,
} from "./storage.service.js";
import type {
  ConfirmAttachmentInput,
  RequestUploadUrlInput,
} from "../validators/attachment.validators.js";

export type AttachmentResponse = {
  id: string;
  userId: string;
  tripId: string;
  travelItemId: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  storageProvider: "r2";
  uploadedAt: string;
  createdAt: string;
  updatedAt: string;
};

export type UploadUrlResponse = {
  uploadUrl: string;
  storageKey: string;
  expiresIn: number;
  fileName: string;
  mimeType: string;
  fileSize: number;
};

export type AttachmentAccessResponse = {
  downloadUrl: string;
  expiresIn: number;
  fileName: string;
  mimeType: string;
};

const toAttachmentResponse = (
  attachment: AttachmentDocument,
): AttachmentResponse => ({
  id: String(attachment._id),
  userId: String(attachment.userId),
  tripId: String(attachment.tripId),
  travelItemId: String(attachment.travelItemId),
  fileName: attachment.fileName,
  mimeType: attachment.mimeType,
  fileSize: attachment.fileSize,
  storageProvider: attachment.storageProvider,
  uploadedAt: attachment.uploadedAt.toISOString(),
  createdAt: attachment.createdAt.toISOString(),
  updatedAt: attachment.updatedAt.toISOString(),
});

const sanitizeDisplayFileName = (fileName: string): string => {
  const base = path.basename(fileName).replace(/[^\w.\- ()[\]]+/g, "_");
  return base.slice(0, 255) || "file";
};

const buildStorageKey = (input: {
  userId: string;
  tripId: string;
  travelItemId: string;
  mimeType: AllowedMimeType;
}): string => {
  const extension = MIME_EXTENSION_MAP[input.mimeType];
  return `users/${input.userId}/trips/${input.tripId}/travel-items/${input.travelItemId}/${randomUUID()}.${extension}`;
};

export const getOwnedTravelItemOrThrow = async (
  tripId: string,
  travelItemId: string,
  userId: string,
) => {
  const trip = await getOwnedTripOrThrow(tripId, userId);
  assertValidObjectId(travelItemId, "Travel item");

  const item = await TravelItem.findOne({
    _id: travelItemId,
    tripId: trip._id,
    userId,
  });

  if (!item) {
    throw new AppError("Travel item not found", 404);
  }

  return { trip, item };
};

const assertOwnedStorageKey = (
  storageKey: string,
  userId: string,
  tripId: string,
  travelItemId: string,
): void => {
  const expectedPrefix = `users/${userId}/trips/${tripId}/travel-items/${travelItemId}/`;

  if (!storageKey.startsWith(expectedPrefix)) {
    throw new AppError("Invalid storage key", 400);
  }
};

export const requestUploadUrl = async (
  tripId: string,
  travelItemId: string,
  userId: string,
  input: RequestUploadUrlInput,
): Promise<UploadUrlResponse> => {
  await getOwnedTravelItemOrThrow(tripId, travelItemId, userId);

  const fileName = sanitizeDisplayFileName(input.fileName);
  const storageKey = buildStorageKey({
    userId,
    tripId,
    travelItemId,
    mimeType: input.mimeType,
  });

  const { uploadUrl, expiresIn } = await createPresignedUploadUrl({
    storageKey,
    mimeType: input.mimeType,
    fileSize: input.fileSize,
  });

  return {
    uploadUrl,
    storageKey,
    expiresIn,
    fileName,
    mimeType: input.mimeType,
    fileSize: input.fileSize,
  };
};

export const confirmAttachment = async (
  tripId: string,
  travelItemId: string,
  userId: string,
  input: ConfirmAttachmentInput,
): Promise<AttachmentResponse> => {
  const { trip, item } = await getOwnedTravelItemOrThrow(
    tripId,
    travelItemId,
    userId,
  );

  assertOwnedStorageKey(input.storageKey, userId, tripId, travelItemId);

  if (input.fileSize > getMaxFileSizeBytes()) {
    throw new AppError("File is too large", 400);
  }

  const exists = await objectExists(input.storageKey);

  if (!exists) {
    throw new AppError("Uploaded file was not found in storage", 400);
  }

  const existing = await Attachment.findOne({ storageKey: input.storageKey });

  if (existing) {
    if (String(existing.userId) !== userId) {
      throw new AppError("Attachment not found", 404);
    }

    return toAttachmentResponse(existing);
  }

  try {
    const attachment = await Attachment.create({
      userId,
      tripId: trip._id,
      travelItemId: item._id,
      fileName: sanitizeDisplayFileName(input.fileName),
      mimeType: input.mimeType,
      fileSize: input.fileSize,
      storageProvider: "r2",
      storageKey: input.storageKey,
      uploadedAt: new Date(),
    });

    return toAttachmentResponse(attachment);
  } catch (error) {
    // Avoid leaving orphaned objects when metadata persistence fails.
    try {
      await deleteObject(input.storageKey);
    } catch {
      // Prefer surfacing the original metadata failure.
    }

    throw error;
  }
};

export const listAttachments = async (
  tripId: string,
  travelItemId: string,
  userId: string,
): Promise<AttachmentResponse[]> => {
  await getOwnedTravelItemOrThrow(tripId, travelItemId, userId);

  const attachments = await Attachment.find({
    tripId,
    travelItemId,
    userId,
  }).sort({ uploadedAt: -1 });

  return attachments.map(toAttachmentResponse);
};

export const getAttachmentAccessUrl = async (
  attachmentId: string,
  userId: string,
): Promise<AttachmentAccessResponse> => {
  assertValidObjectId(attachmentId, "Attachment");

  const attachment = await Attachment.findOne({
    _id: attachmentId,
    userId,
  });

  if (!attachment) {
    throw new AppError("Attachment not found", 404);
  }

  const { downloadUrl, expiresIn } = await createPresignedDownloadUrl({
    storageKey: attachment.storageKey,
    fileName: attachment.fileName,
  });

  return {
    downloadUrl,
    expiresIn,
    fileName: attachment.fileName,
    mimeType: attachment.mimeType,
  };
};

export const deleteAttachment = async (
  attachmentId: string,
  userId: string,
): Promise<void> => {
  assertValidObjectId(attachmentId, "Attachment");

  const attachment = await Attachment.findOne({
    _id: attachmentId,
    userId,
  });

  if (!attachment) {
    throw new AppError("Attachment not found", 404);
  }

  await deleteObject(attachment.storageKey);
  await attachment.deleteOne();
};

export const deleteAttachmentsForTravelItem = async (
  travelItemId: string,
  userId: string,
): Promise<void> => {
  const attachments = await Attachment.find({ travelItemId, userId });

  for (const attachment of attachments) {
    try {
      await deleteObject(attachment.storageKey);
    } catch {
      // Continue deleting remaining files; metadata cleanup still proceeds.
    }
  }

  await Attachment.deleteMany({ travelItemId, userId });
};
