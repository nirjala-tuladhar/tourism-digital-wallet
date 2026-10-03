import mongoose, { HydratedDocument, Schema, Types } from "mongoose";

export const NOTIFICATION_TYPES = [
  "expiry_soon",
  "expiry_urgent",
  "expiry_day",
  "expiry_today",
  "expiry_expired",
  "trip_start",
  "trip_end",
  "important_date",
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export type NotificationAttrs = {
  userId: Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  relatedTripId?: Types.ObjectId;
  relatedTravelItemId?: Types.ObjectId;
  read: boolean;
  readAt?: Date;
  dedupeKey: string;
  metadata?: {
    expiresAt?: string;
    daysUntilExpiry?: number;
  };
  createdAt: Date;
  updatedAt: Date;
};

export type NotificationDocument = HydratedDocument<NotificationAttrs>;

const notificationSchema = new Schema<NotificationAttrs>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: NOTIFICATION_TYPES,
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    relatedTripId: {
      type: Schema.Types.ObjectId,
      ref: "Trip",
    },
    relatedTravelItemId: {
      type: Schema.Types.ObjectId,
      ref: "TravelItem",
    },
    read: {
      type: Boolean,
      default: false,
      required: true,
    },
    readAt: {
      type: Date,
    },
    dedupeKey: {
      type: String,
      required: true,
      trim: true,
    },
    metadata: {
      expiresAt: { type: String },
      daysUntilExpiry: { type: Number },
    },
  },
  { timestamps: true },
);

notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, read: 1 });
notificationSchema.index({ userId: 1, dedupeKey: 1 }, { unique: true });

export const Notification = mongoose.model<NotificationAttrs>(
  "Notification",
  notificationSchema,
);
