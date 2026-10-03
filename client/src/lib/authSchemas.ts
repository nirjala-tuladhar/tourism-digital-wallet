import { z } from "zod";

const NAME_PATTERN = /^\p{L}+(?:[ '\u2019-]\p{L}+)*$/u;

const normalizeName = (value: string): string => value.trim().replace(/\s+/g, " ");

export const isValidEmailAddress = (value: string): boolean => {
  const match = /^([^\s@]+)@([^\s@]+)$/.exec(value);

  if (!match) {
    return false;
  }

  const [, local, domain] = match;

  if (!local || !domain || local.length > 64 || domain.length > 253) {
    return false;
  }

  if (local.startsWith(".") || local.endsWith(".") || local.includes("..")) {
    return false;
  }

  if (!/^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+$/.test(local)) {
    return false;
  }

  const labels = domain.split(".");

  if (labels.length < 2) {
    return false;
  }

  const labelIsValid = labels.every(
    (label) =>
      label.length > 0 &&
      label.length <= 63 &&
      /^[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?$/.test(label),
  );

  if (!labelIsValid) {
    return false;
  }

  return /^[A-Za-z]{2,}$/.test(labels[labels.length - 1] ?? "");
};

export const fullNameSchema = z
  .string()
  .superRefine((value, ctx) => {
    const name = normalizeName(value);

    if (!name) {
      ctx.addIssue({ code: "custom", message: "Full Name is required." });
      return;
    }

    if (name.length > 100) {
      ctx.addIssue({
        code: "custom",
        message: "Name must be 100 characters or fewer",
      });
      return;
    }

    if (!NAME_PATTERN.test(name)) {
      ctx.addIssue({
        code: "custom",
        message: "Please enter a valid full name.",
      });
    }
  })
  .transform((value) => normalizeName(value));

export const emailSchema = z
  .string()
  .superRefine((value, ctx) => {
    const email = value.trim();

    if (!email) {
      ctx.addIssue({ code: "custom", message: "Email is required." });
      return;
    }

    if (!isValidEmailAddress(email)) {
      ctx.addIssue({
        code: "custom",
        message: "Please enter a valid email address.",
      });
    }
  })
  .transform((value) => value.trim());

export const passwordSchema = z.string().superRefine((value, ctx) => {
  if (value.length === 0) {
    ctx.addIssue({ code: "custom", message: "Password is required." });
    return;
  }

  if (/\s/.test(value)) {
    ctx.addIssue({
      code: "custom",
      message: "Password cannot contain spaces.",
    });
    return;
  }

  if (value.length < 8) {
    ctx.addIssue({
      code: "custom",
      message: "Password must be at least 8 characters.",
    });
    return;
  }

  if (value.length > 128) {
    ctx.addIssue({
      code: "custom",
      message: "Password must be 128 characters or fewer.",
    });
  }
});

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const registerSchema = z.object({
  name: fullNameSchema,
  email: emailSchema,
  password: passwordSchema,
});

export const authInputClass = (invalid: boolean): string =>
  `w-full rounded-xl border bg-white/5 px-3.5 py-3 text-white outline-none transition placeholder:text-teal-100/40 focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60 ${
    invalid
      ? "border-rose-400 focus:border-rose-300 focus:ring-rose-300/40"
      : "border-white/15 focus:border-teal-300/60 focus:ring-teal-300/30"
  }`;
