import type { NextFunction, Request, Response } from "express";
import { AppError } from "../middlewares/AppError.js";
import type { ApiSuccessResponse } from "../types/api.types.js";
import { requireUserId } from "../utils/auth.js";
import { formatZodError } from "../utils/validation.js";
import {
  confirmAttachment,
  deleteAttachment,
  getAttachmentAccessUrl,
  listAttachments,
  requestUploadUrl,
  type AttachmentAccessResponse,
  type AttachmentResponse,
  type UploadUrlResponse,
} from "../services/attachment.service.js";
import {
  confirmAttachmentSchema,
  requestUploadUrlSchema,
} from "../validators/attachment.validators.js";

export const requestUploadUrlHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = requireUserId(req.user?.id);
    const parsed = requestUploadUrlSchema.safeParse(req.body);

    if (!parsed.success) {
      throw new AppError(formatZodError(parsed.error), 400);
    }

    const data = await requestUploadUrl(
      String(req.params.tripId),
      String(req.params.itemId),
      userId,
      parsed.data,
    );

    const response: ApiSuccessResponse<UploadUrlResponse> = {
      success: true,
      data,
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const confirmAttachmentHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = requireUserId(req.user?.id);
    const parsed = confirmAttachmentSchema.safeParse(req.body);

    if (!parsed.success) {
      throw new AppError(formatZodError(parsed.error), 400);
    }

    const data = await confirmAttachment(
      String(req.params.tripId),
      String(req.params.itemId),
      userId,
      parsed.data,
    );

    const response: ApiSuccessResponse<AttachmentResponse> = {
      success: true,
      data,
    };

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
};

export const listAttachmentsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = requireUserId(req.user?.id);
    const data = await listAttachments(
      String(req.params.tripId),
      String(req.params.itemId),
      userId,
    );

    const response: ApiSuccessResponse<AttachmentResponse[]> = {
      success: true,
      data,
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const getAttachmentUrlHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = requireUserId(req.user?.id);
    const data = await getAttachmentAccessUrl(
      String(req.params.attachmentId),
      userId,
    );

    const response: ApiSuccessResponse<AttachmentAccessResponse> = {
      success: true,
      data,
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const deleteAttachmentHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = requireUserId(req.user?.id);
    await deleteAttachment(String(req.params.attachmentId), userId);

    const response: ApiSuccessResponse<{ message: string }> = {
      success: true,
      data: { message: "Attachment deleted successfully" },
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};
