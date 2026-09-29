export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  const rounded = unitIndex === 0 ? size : Math.round(size * 10) / 10;
  return `${rounded} ${units[unitIndex]}`;
}

export function isImageMimeType(mimeType: string): boolean {
  return mimeType.startsWith("image/");
}

export function fileTypeLabel(mimeType: string): string {
  if (mimeType === "application/pdf") return "PDF";
  if (mimeType === "image/jpeg") return "JPG";
  if (mimeType === "image/png") return "PNG";
  if (mimeType === "image/webp") return "WebP";
  return "File";
}
