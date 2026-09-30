import { z } from "zod";

const MIN_YEAR = 1970;
const MAX_YEAR = 2100;

export const isReasonableDate = (value: string): boolean => {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return false;
  }

  const year = parsed.getUTCFullYear();
  return year >= MIN_YEAR && year <= MAX_YEAR;
};

/** Optional calendar date. Empty string and null mean "no date". */
export const optionalDateField = z
  .union([z.string(), z.null()])
  .optional()
  .transform((value, ctx) => {
    if (value === undefined) {
      return undefined;
    }

    if (value === null || value.trim() === "") {
      return null;
    }

    const trimmed = value.trim();

    if (Number.isNaN(Date.parse(trimmed)) || !isReasonableDate(trimmed)) {
      ctx.addIssue({
        code: "custom",
        message: "Date must be a valid date between 1970 and 2100",
      });
      return z.NEVER;
    }

    return trimmed;
  });
