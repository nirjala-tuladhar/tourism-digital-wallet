import mongoose, { HydratedDocument, Schema, Types } from "mongoose";

export const TRIP_STATUSES = ["upcoming", "active", "completed", "cancelled"] as const;
export type TripStatus = (typeof TRIP_STATUSES)[number];

/** Legacy value kept so trips saved before the lifecycle change still load. */
export const STORED_TRIP_STATUSES = [...TRIP_STATUSES, "inactive"] as const;

export const normalizeTripStatus = (status: string): TripStatus =>
  status === "inactive" ? "cancelled" : status === "upcoming" || status === "active" || status === "completed" || status === "cancelled"
    ? status
    : "upcoming";

export const canTransitionTripStatus = (from: TripStatus, to: TripStatus): boolean => {
  if (from === to) {
    return true;
  }

  const allowed: Record<TripStatus, TripStatus[]> = {
    upcoming: ["active", "completed", "cancelled"],
    active: ["completed", "cancelled"],
    completed: ["cancelled"],
    cancelled: ["upcoming", "active"],
  };

  return allowed[from].includes(to);
};

export type TripAttrs = {
  userId: Types.ObjectId;
  name: string;
  origin: string;
  destination: string;
  startDate: Date;
  endDate: Date;
  status: TripStatus;
  description?: string;
  budgetAmount?: number | null;
  budgetCurrency?: string | null;
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
      enum: STORED_TRIP_STATUSES,
      default: "upcoming",
      required: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    budgetAmount: {
      type: Number,
      default: null,
    },
    budgetCurrency: {
      type: String,
      uppercase: true,
      trim: true,
      default: null,
    },
  },
  { timestamps: true },
);

// Speeds up "my trips by date" and dashboard upcoming queries.
tripSchema.index({ userId: 1, startDate: 1 });
tripSchema.index({ userId: 1, status: 1 });

export const Trip = mongoose.model<TripAttrs>("Trip", tripSchema);
