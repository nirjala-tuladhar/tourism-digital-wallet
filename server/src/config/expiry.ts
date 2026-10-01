/**
 * Reminder windows, largest first. Each window is stored once per item and expiry date.
 * Day 0 ("expires today") and already-expired items are separate events.
 */
export const EXPIRY_REMINDER_DAYS = [30, 7, 1] as const;

/** Dashboard "expiring soon" uses the widest reminder window. */
export const EXPIRING_SOON_DAYS = Math.max(...EXPIRY_REMINDER_DAYS);

export type ExpiryReminderKind = "soon" | "urgent" | "day" | "today" | "expired";

export type ExpiryReminder = {
  kind: ExpiryReminderKind;
  dedupeSuffix: string;
};

export const selectExpiryReminder = (
  daysUntilExpiry: number,
): ExpiryReminder | null => {
  if (daysUntilExpiry < 0) {
    return { kind: "expired", dedupeSuffix: "expired" };
  }

  if (daysUntilExpiry === 0) {
    return { kind: "today", dedupeSuffix: "0" };
  }

  const window = [...EXPIRY_REMINDER_DAYS]
    .sort((left, right) => left - right)
    .find((day) => daysUntilExpiry <= day);

  if (window === undefined) {
    return null;
  }

  if (window <= 1) {
    return { kind: "day", dedupeSuffix: String(window) };
  }

  if (window <= 7) {
    return { kind: "urgent", dedupeSuffix: String(window) };
  }

  return { kind: "soon", dedupeSuffix: String(window) };
};

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
