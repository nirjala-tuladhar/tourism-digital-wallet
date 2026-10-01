import { apiClient } from "./client";
import type { ApiSuccessResponse } from "../types/api.types";

export type Attachment = {
  id: string;
  userId: string;
  tripId: string;
  travelItemId: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  storageProvider: "b2";
  uploadedAt: string;
  createdAt: string;
  updatedAt: string;
};

export type UploadUrlPayload = {
  fileName: string;
  mimeType: string;
  fileSize: number;
};

export type UploadUrlResponse = {
  uploadUrl: string;
  storageKey: string;
  expiresIn: number;
  fileName: string;
  mimeType: string;
  fileSize: number;
};

export type ConfirmAttachmentPayload = {
  storageKey: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
};

export type AttachmentAccessResponse = {
  downloadUrl: string;
  expiresIn: number;
  fileName: string;
  mimeType: string;
};

export const attachmentsApi = {
  list: (tripId: string, travelItemId: string, token: string) =>
    apiClient.get<ApiSuccessResponse<Attachment[]>>(
      `/api/trips/${tripId}/items/${travelItemId}/attachments`,
      token,
    ),

  requestUploadUrl: (
    tripId: string,
    travelItemId: string,
    payload: UploadUrlPayload,
    token: string,
  ) =>
    apiClient.post<ApiSuccessResponse<UploadUrlResponse>>(
      `/api/trips/${tripId}/items/${travelItemId}/attachments/upload-url`,
      payload,
      token,
    ),

  confirm: (
    tripId: string,
    travelItemId: string,
    payload: ConfirmAttachmentPayload,
    token: string,
  ) =>
    apiClient.post<ApiSuccessResponse<Attachment>>(
      `/api/trips/${tripId}/items/${travelItemId}/attachments`,
      payload,
      token,
    ),

  getAccessUrl: (attachmentId: string, token: string) =>
    apiClient.get<ApiSuccessResponse<AttachmentAccessResponse>>(
      `/api/attachments/${attachmentId}/url`,
      token,
    ),

  remove: (attachmentId: string, token: string) =>
    apiClient.delete<ApiSuccessResponse<{ message: string }>>(
      `/api/attachments/${attachmentId}`,
      token,
    ),
};

export async function uploadFileToPresignedUrl(
  uploadUrl: string,
  file: File,
): Promise<void> {
  const response = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": file.type,
    },
    body: file,
  });

  if (!response.ok) {
    throw new Error("Upload to storage failed");
  }
}
