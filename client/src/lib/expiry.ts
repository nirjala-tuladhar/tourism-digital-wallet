export type ExpiryStatus = "none" | "active" | "expiring_soon" | "expired";

export function isReasonableExpiryDate(value: string): boolean {
  if (!value.trim()) {
    return true;
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return false;
  }

  const year = parsed.getUTCFullYear();
  return year >= 1970 && year <= 2100;
}

export function formatExpiry(
  status: ExpiryStatus,
  daysUntilExpiry: number | null,
): string | null {
  if (status === "none" || daysUntilExpiry === null) {
    return null;
  }

  if (status === "expired") {
    const ago = Math.abs(daysUntilExpiry);
    if (ago <= 0) return "Expired";
    return ago === 1 ? "Expired 1 day ago" : `Expired ${ago} days ago`;
  }

  if (daysUntilExpiry === 0) return "Expires today";
  if (daysUntilExpiry === 1) return "Expires in 1 day";
  return `Expires in ${daysUntilExpiry} days`;
}

export function expiryBadgeClass(status: ExpiryStatus): string {
  if (status === "expired") {
    return "bg-rose-50 text-rose-700";
  }

  if (status === "expiring_soon") {
    return "bg-amber-50 text-amber-800";
  }

  if (status === "active") {
    return "bg-teal-50 text-teal-800";
  }

  return "bg-slate-100 text-slate-600";
}
