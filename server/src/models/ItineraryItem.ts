import mongoose, { HydratedDocument, Schema, Types } from "mongoose";

export type ItineraryItemAttrs = {
  userId: Types.ObjectId;
  tripId: Types.ObjectId;
  travelItemId?: Types.ObjectId | null;
  date: Date;
  time?: string;
  title: string;
  location?: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type ItineraryItemDocument = HydratedDocument<ItineraryItemAttrs>;

const itineraryItemSchema = new Schema<ItineraryItemAttrs>(
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
      default: null,
    },
    date: {
      type: Date,
      required: true,
    },
    time: {
      type: String,
      trim: true,
      maxlength: 5,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160,
    },
    location: {
      type: String,
      trim: true,
      maxlength: 160,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
  },
  { timestamps: true },
);

itineraryItemSchema.index({ tripId: 1, userId: 1, date: 1, time: 1 });

export const ItineraryItem = mongoose.model<ItineraryItemAttrs>(
  "ItineraryItem",
  itineraryItemSchema,
);
