import { useId, useRef, useState } from "react";
import {
  ExternalLink,
  FileText,
  Image as ImageIcon,
  LoaderCircle,
  Trash2,
  Upload,
} from "lucide-react";
import type { Attachment } from "../../api/attachments.api";
import { ApiClientError } from "../../api/client";
import {
  useDeleteAttachment,
  useOpenAttachment,
  useTravelItemAttachments,
  useUploadTravelItemAttachments,
} from "../../hooks/useAttachments";
import {
  fileTypeLabel,
  formatFileSize,
  isImageMimeType,
} from "../../lib/files";
import { formatTripDate } from "../../lib/date";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { FeedbackBanner } from "../ui/FeedbackBanner";
import { Skeleton } from "../ui/Skeleton";

type TravelItemAttachmentsSectionProps = {
  tripId: string;
  travelItemId: string;
};

type UploadStatusRow = {
  fileName: string;
  status: "uploading" | "uploaded" | "failed";
  message?: string;
};

export function TravelItemAttachmentsSection({
  tripId,
  travelItemId,
}: TravelItemAttachmentsSectionProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const { data, isLoading, isError, error, refetch } = useTravelItemAttachments(
    tripId,
    travelItemId,
  );
  const uploadMutation = useUploadTravelItemAttachments(tripId, travelItemId);
  const deleteMutation = useDeleteAttachment(tripId, travelItemId);
  const openMutation = useOpenAttachment();

  const [uploadRows, setUploadRows] = useState<UploadStatusRow[]>([]);
  const [actionError, setActionError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Attachment | null>(null);
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});

  const handleFilesSelected = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) {
      return;
    }

    const files = Array.from(fileList);
    setActionError(null);
    setUploadRows(
      files.map((file) => ({
        fileName: file.name,
        status: "uploading",
      })),
    );

    try {
      const results = await uploadMutation.mutateAsync(files);
      setUploadRows(
        results.map((result) => ({
          fileName: result.fileName,
          status: result.status,
          message: result.message,
        })),
      );
    } catch (err) {
      setActionError(
        err instanceof ApiClientError
          ? err.message
          : "Unable to upload files.",
      );
      setUploadRows([]);
    } finally {
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  };

  const openAttachment = async (attachment: Attachment) => {
    setActionError(null);

    try {
      const access = await openMutation.mutateAsync(attachment.id);

      if (isImageMimeType(attachment.mimeType)) {
        setPreviewUrls((current) => ({
          ...current,
          [attachment.id]: access.downloadUrl,
        }));
      }

      window.open(access.downloadUrl, "_blank", "noopener,noreferrer");
    } catch (err) {
      setActionError(
        err instanceof ApiClientError
          ? err.message
          : "Unable to open attachment.",
      );
    }
  };

  return (
    <section className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Attachments
        </h3>
        <div>
          <input
            id={inputId}
            ref={inputRef}
            type="file"
            multiple
            accept="application/pdf,image/jpeg,image/png,image/webp,.pdf,.jpg,.jpeg,.png,.webp"
            className="sr-only"
            onChange={(event) => handleFilesSelected(event.target.files)}
            disabled={uploadMutation.isPending}
          />
          <label
            htmlFor={inputId}
            className={`inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-teal-200 hover:shadow-md focus-within:outline-none focus-within:ring-2 focus-within:ring-teal-600 ${
              uploadMutation.isPending ? "pointer-events-none opacity-60" : ""
            }`}
          >
            {uploadMutation.isPending ? (
              <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Upload className="h-4 w-4" aria-hidden="true" />
            )}
            {uploadMutation.isPending ? "Uploading..." : "Upload files"}
          </label>
        </div>
      </div>

      <p className="text-xs text-slate-500">
        PDF, JPG, PNG, or WebP. Max size is enforced by the server.
      </p>

      {actionError ? <FeedbackBanner tone="error" message={actionError} /> : null}

      {uploadRows.length > 0 ? (
        <ul className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
          {uploadRows.map((row) => (
            <li
              key={`${row.fileName}-${row.status}`}
              className="flex items-center justify-between gap-3 text-sm"
            >
              <span className="truncate text-slate-700">{row.fileName}</span>
              <span
                className={
                  row.status === "uploaded"
                    ? "text-emerald-700"
                    : row.status === "failed"
                      ? "text-rose-700"
                      : "text-slate-500"
                }
              >
                {row.status === "uploading"
                  ? "Uploading..."
                  : row.status === "uploaded"
                    ? "Uploaded"
                    : row.message || "Failed"}
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      ) : null}

      {isError ? (
        <div className="space-y-2">
          <FeedbackBanner
            tone="error"
            message={
              error instanceof ApiClientError
                ? error.message
                : "Unable to load attachments."
            }
          />
          <button
            type="button"
            onClick={() => refetch()}
            className="text-sm font-medium text-teal-700 hover:underline"
          >
            Try again
          </button>
        </div>
      ) : null}

      {!isLoading && !isError && (data?.length ?? 0) === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 px-4 py-6 text-center">
          <p className="font-medium text-slate-800">No attachments yet</p>
          <p className="mt-1 text-sm text-slate-500">
            Upload your travel documents, confirmations, tickets, images, or
            other files here.
          </p>
          <label
            htmlFor={inputId}
            className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-600"
          >
            <Upload className="h-4 w-4" aria-hidden="true" />
            Upload files
          </label>
        </div>
      ) : null}

      <ul className="space-y-3">
        {data?.map((attachment) => {
          const isImage = isImageMimeType(attachment.mimeType);
          const previewUrl = previewUrls[attachment.id];

          return (
            <li
              key={attachment.id}
              className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition hover:border-teal-200 hover:shadow-md"
            >
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-slate-100 p-2 text-slate-600">
                  {isImage ? (
                    <ImageIcon className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <FileText className="h-5 w-5" aria-hidden="true" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-slate-900">
                    {attachment.fileName}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {fileTypeLabel(attachment.mimeType)} ·{" "}
                    {formatFileSize(attachment.fileSize)} ·{" "}
                    {formatTripDate(attachment.uploadedAt)}
                  </p>

                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt={attachment.fileName}
                      className="mt-3 max-h-40 rounded-xl border border-slate-200 object-cover"
                    />
                  ) : null}

                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => openAttachment(attachment)}
                      disabled={openMutation.isPending}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 disabled:opacity-60"
                    >
                      <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                      Open
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(attachment)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 px-2.5 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete attachment?"
        description={
          deleteTarget
            ? `Are you sure you want to delete "${deleteTarget.fileName}"? This removes the file from storage permanently.`
            : "Are you sure you want to delete this attachment?"
        }
        confirmLabel="Delete"
        destructive
        busy={deleteMutation.isPending}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (!deleteTarget) return;
          try {
            await deleteMutation.mutateAsync(deleteTarget.id);
            setDeleteTarget(null);
            setPreviewUrls((current) => {
              const next = { ...current };
              delete next[deleteTarget.id];
              return next;
            });
          } catch (err) {
            setDeleteTarget(null);
            setActionError(
              err instanceof ApiClientError
                ? err.message
                : "Unable to delete attachment.",
            );
          }
        }}
      />
    </section>
  );
}
