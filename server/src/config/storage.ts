export const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

export const MIME_EXTENSION_MAP: Record<AllowedMimeType, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export const getMaxFileSizeBytes = (): number => {
  const mb = Number(process.env.MAX_FILE_SIZE_MB || "10");
  const safeMb = Number.isFinite(mb) && mb > 0 ? mb : 10;
  return Math.floor(safeMb * 1024 * 1024);
};

export const getUploadUrlExpiresInSeconds = (): number => {
  const value = Number(process.env.R2_UPLOAD_URL_EXPIRES_IN || "300");
  return Number.isFinite(value) && value > 0 ? value : 300;
};

export const getDownloadUrlExpiresInSeconds = (): number => {
  const value = Number(process.env.R2_DOWNLOAD_URL_EXPIRES_IN || "300");
  return Number.isFinite(value) && value > 0 ? value : 300;
};
