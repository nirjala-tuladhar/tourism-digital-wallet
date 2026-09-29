import mongoose, { HydratedDocument, Schema, Types } from "mongoose";

export type AttachmentAttrs = {
  userId: Types.ObjectId;
  tripId: Types.ObjectId;
  travelItemId: Types.ObjectId;
  fileName: string;
  mimeType: string;
  fileSize: number;
  storageProvider: "r2";
  storageKey: string;
  uploadedAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type AttachmentDocument = HydratedDocument<AttachmentAttrs>;

const attachmentSchema = new Schema<AttachmentAttrs>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    tripId: {
      type: Schema.Types.ObjectId,
      ref: "Trip",
      required: true,
      index: true,
    },
    travelItemId: {
      type: Schema.Types.ObjectId,
      ref: "TravelItem",
      required: true,
      index: true,
    },
    fileName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 255,
    },
    mimeType: {
      type: String,
      required: true,
      trim: true,
    },
    fileSize: {
      type: Number,
      required: true,
      min: 1,
    },
    storageProvider: {
      type: String,
      enum: ["r2"],
      default: "r2",
      required: true,
    },
    storageKey: {
      type: String,
      required: true,
      unique: true,
    },
    uploadedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  { timestamps: true },
);

// Speeds up listing attachments for a travel item owned by a user.
attachmentSchema.index({ travelItemId: 1, userId: 1 });
attachmentSchema.index({ userId: 1, uploadedAt: -1 });

export const Attachment = mongoose.model<AttachmentAttrs>(
  "Attachment",
  attachmentSchema,
);
