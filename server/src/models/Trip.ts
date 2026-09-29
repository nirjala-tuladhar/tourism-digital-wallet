import mongoose, { HydratedDocument, Schema, Types } from "mongoose";

export const TRIP_STATUSES = ["active", "inactive"] as const;
export type TripStatus = (typeof TRIP_STATUSES)[number];

export type TripAttrs = {
  userId: Types.ObjectId;
  name: string;
  origin: string;
  destination: string;
  startDate: Date;
  endDate: Date;
  status: TripStatus;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type TripDocument = HydratedDocument<TripAttrs>;

const tripSchema = new Schema<TripAttrs>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    origin: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    destination: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: TRIP_STATUSES,
      default: "active",
      required: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
  },
  { timestamps: true },
);

// Speeds up "my trips by date" and dashboard upcoming queries.
tripSchema.index({ userId: 1, startDate: 1 });
tripSchema.index({ userId: 1, status: 1 });

export const Trip = mongoose.model<TripAttrs>("Trip", tripSchema);
