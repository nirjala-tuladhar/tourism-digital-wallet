import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  attachmentsApi,
  uploadFileToPresignedUrl,
  type ConfirmAttachmentPayload,
  type UploadUrlPayload,
} from "../api/attachments.api";
import { ApiClientError } from "../api/client";
import { queryKeys } from "../lib/queryKeys";
import { useAppSelector } from "../store/hooks";

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export function useTravelItemAttachments(
  tripId: string | undefined,
  travelItemId: string | undefined,
) {
  const token = useAppSelector((state) => state.auth.token);

  return useQuery({
    queryKey: queryKeys.attachments(tripId ?? "unknown", travelItemId ?? "unknown"),
    enabled: Boolean(token && tripId && travelItemId),
    queryFn: async () => {
      const response = await attachmentsApi.list(tripId!, travelItemId!, token!);
      return response.data;
    },
  });
}

export function useUploadTravelItemAttachments(
  tripId: string,
  travelItemId: string,
) {
  const queryClient = useQueryClient();
  const token = useAppSelector((state) => state.auth.token)!;

  return useMutation({
    mutationFn: async (files: File[]) => {
      const results: Array<{
        fileName: string;
        status: "uploaded" | "failed";
        message?: string;
      }> = [];

      for (const file of files) {
        try {
          if (!ALLOWED_MIME_TYPES.has(file.type)) {
            throw new Error(
              "Unsupported file type. Allowed: PDF, JPG, PNG, WebP",
            );
          }

          const payload: UploadUrlPayload = {
            fileName: file.name,
            mimeType: file.type,
            fileSize: file.size,
          };

          const uploadUrlResponse = await attachmentsApi.requestUploadUrl(
            tripId,
            travelItemId,
            payload,
            token,
          );

          await uploadFileToPresignedUrl(
            uploadUrlResponse.data.uploadUrl,
            file,
          );

          const confirmPayload: ConfirmAttachmentPayload = {
            storageKey: uploadUrlResponse.data.storageKey,
            fileName: uploadUrlResponse.data.fileName,
            mimeType: uploadUrlResponse.data.mimeType,
            fileSize: uploadUrlResponse.data.fileSize,
          };

          await attachmentsApi.confirm(
            tripId,
            travelItemId,
            confirmPayload,
            token,
          );

          results.push({ fileName: file.name, status: "uploaded" });
        } catch (error) {
          results.push({
            fileName: file.name,
            status: "failed",
            message:
              error instanceof ApiClientError
                ? error.message
                : error instanceof Error
                  ? error.message
                  : "Upload failed",
          });
        }
      }

      return results;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.attachments(tripId, travelItemId),
      });
    },
  });
}

export function useDeleteAttachment(tripId: string, travelItemId: string) {
  const queryClient = useQueryClient();
  const token = useAppSelector((state) => state.auth.token)!;

  return useMutation({
    mutationFn: async (attachmentId: string) => {
      await attachmentsApi.remove(attachmentId, token);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.attachments(tripId, travelItemId),
      });
    },
  });
}

export function useOpenAttachment() {
  const token = useAppSelector((state) => state.auth.token)!;

  return useMutation({
    mutationFn: async (attachmentId: string) => {
      const response = await attachmentsApi.getAccessUrl(attachmentId, token);
      return response.data;
    },
  });
}
