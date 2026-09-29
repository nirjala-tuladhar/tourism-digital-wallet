import mongoose from "mongoose";
import { AppError } from "../middlewares/AppError.js";

export const assertValidObjectId = (id: string, label = "Resource"): void => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(`${label} not found`, 404);
  }
};

export const requireUserId = (userId: string | undefined): string => {
  if (!userId) {
    throw new AppError("Authentication required", 401);
  }

  return userId;
};
