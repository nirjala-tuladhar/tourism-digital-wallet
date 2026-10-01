import mongoose, { HydratedDocument, Schema, Types } from "mongoose";

export const IMPORTANT_DATE_TYPES = [
  "Flight departure",
  "Hotel check-in",
  "Hotel check-out",
  "Visa expiry",
  "Insurance expiry",
  "Activity date",
  "Other",
] as const;

export type ImportantDateType = (typeof IMPORTANT_DATE_TYPES)[number];

export type ImportantDateAttrs = {
  userId: Types.ObjectId;
  tripId: Types.ObjectId;
  travelItemId?: Types.ObjectId;
  title: string;
  date: Date;
  type: ImportantDateType;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type ImportantDateDocument = HydratedDocument<ImportantDateAttrs>;

const importantDateSchema = new Schema<ImportantDateAttrs>(
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
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: IMPORTANT_DATE_TYPES,
      required: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
  },
  { timestamps: true },
);

// Speeds up chronological trip timelines and dashboard upcoming dates.
importantDateSchema.index({ tripId: 1, date: 1 });
importantDateSchema.index({ userId: 1, date: 1 });

export const ImportantDate = mongoose.model<ImportantDateAttrs>(
  "ImportantDate",
  importantDateSchema,
);
