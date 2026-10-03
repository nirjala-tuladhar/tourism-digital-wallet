import mongoose, { HydratedDocument, Schema, Types } from "mongoose";

export type ChecklistItemAttrs = {
  userId: Types.ObjectId;
  tripId: Types.ObjectId;
  title: string;
  completed: boolean;
  position: number;
  createdAt: Date;
  updatedAt: Date;
};

export type ChecklistItemDocument = HydratedDocument<ChecklistItemAttrs>;

const checklistItemSchema = new Schema<ChecklistItemAttrs>(
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
    completed: {
      type: Boolean,
      default: false,
      required: true,
    },
    position: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  { timestamps: true },
);

checklistItemSchema.index({ tripId: 1, userId: 1, position: 1 });

export const ChecklistItem = mongoose.model<ChecklistItemAttrs>(
  "ChecklistItem",
  checklistItemSchema,
);
