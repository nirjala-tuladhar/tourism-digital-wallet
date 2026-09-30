/** Days before expiry when an item is "expiring soon" and can raise a reminder. */
export const EXPIRING_SOON_DAYS = 30;

/** A tighter reminder so the 30-day and 7-day events stay distinct. */
export const EXPIRING_URGENT_DAYS = 7;

export type ExpiryStatus = "none" | "active" | "expiring_soon" | "expired";

export type ExpirySnapshot = {
  expiryStatus: ExpiryStatus;
  daysUntilExpiry: number | null;
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export const startOfUtcDay = (value: Date): Date =>
  new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));

export const parseDateOnly = (value: string): Date => {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    throw new Error("Invalid date");
  }

  return startOfUtcDay(parsed);
};

export const getExpirySnapshot = (
  expiresAt: Date | null | undefined,
  now: Date = new Date(),
): ExpirySnapshot => {
  if (!expiresAt) {
    return { expiryStatus: "none", daysUntilExpiry: null };
  }

  const daysUntilExpiry = Math.round(
    (startOfUtcDay(expiresAt).getTime() - startOfUtcDay(now).getTime()) / MS_PER_DAY,
  );

  if (daysUntilExpiry < 0) {
    return { expiryStatus: "expired", daysUntilExpiry };
  }

  if (daysUntilExpiry <= EXPIRING_SOON_DAYS) {
    return { expiryStatus: "expiring_soon", daysUntilExpiry };
  }

  return { expiryStatus: "active", daysUntilExpiry };
};
