import mongoose, { HydratedDocument, Schema, Types } from "mongoose";

export const TRAVEL_ITEM_CATEGORIES = [
  "Flight",
  "Hotel",
  "Visa",
  "Insurance",
  "Transportation",
  "Activity",
  "Document",
  "Other",
] as const;

export type TravelItemCategory = (typeof TRAVEL_ITEM_CATEGORIES)[number];

export type TravelItemAttrs = {
  userId: Types.ObjectId;
  tripId: Types.ObjectId;
  title: string;
  category: TravelItemCategory;
  description?: string;
  labels: string[];
  expiresAt?: Date | null;
  important: boolean;
  reminderMode: "default" | "custom";
  reminderDays: number[];
  customReminderDates: Date[];
  createdAt: Date;
  updatedAt: Date;
};

export type TravelItemDocument = HydratedDocument<TravelItemAttrs>;

const travelItemSchema = new Schema<TravelItemAttrs>(
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
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160,
    },
    category: {
      type: String,
      enum: TRAVEL_ITEM_CATEGORIES,
      required: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    labels: {
      type: [String],
      default: [],
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    important: {
      type: Boolean,
      default: false,
      required: true,
    },
    reminderMode: {
      type: String,
      enum: ["default", "custom"],
      default: "default",
      required: true,
    },
    reminderDays: {
      type: [Number],
      default: [],
    },
    customReminderDates: {
      type: [Date],
      default: [],
    },
  },
  { timestamps: true },
);

// Speeds up listing items for a trip owned by a user.
travelItemSchema.index({ tripId: 1, userId: 1 });
travelItemSchema.index({ userId: 1, createdAt: -1 });
travelItemSchema.index({ userId: 1, expiresAt: 1 });
travelItemSchema.index({ userId: 1, important: 1 });

export const TravelItem = mongoose.model<TravelItemAttrs>(
  "TravelItem",
  travelItemSchema,
);
